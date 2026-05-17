#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Schuhspiel – Geführte Installation
# Führt dich Schritt für Schritt durch die Einrichtung auf einem vServer.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Farben ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC}  $*"; }
info() { echo -e "${CYAN}ℹ${NC}  $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
err()  { echo -e "${RED}✗${NC}  $*" >&2; }
step() { echo -e "\n${BOLD}${BLUE}── $* ${NC}"; }
hr()   { echo -e "${BLUE}────────────────────────────────────────────────────${NC}"; }

# ── Banner ────────────────────────────────────────────────────────────────────
clear
echo -e "${BOLD}"
echo "   💍  Patrick & Theresa – Schuhspiel"
echo "       Installations-Assistent"
echo -e "${NC}"
hr
echo ""
info "Dieses Skript richtet die komplette App auf deinem vServer ein."
info "Du brauchst: eine Domain (A-Record → Server-IP), Docker & Docker Compose."
echo ""

# ── Schritt 1: Voraussetzungen prüfen ────────────────────────────────────────
step "Schritt 1/5: Voraussetzungen prüfen"

check_cmd() {
  if command -v "$1" &>/dev/null; then
    ok "$1 gefunden ($(command -v "$1"))"
  else
    err "$1 nicht gefunden – bitte zuerst installieren."
    echo ""
    case "$1" in
      docker)
        info "Installation: https://docs.docker.com/engine/install/"
        info "Schnell (Debian/Ubuntu): curl -fsSL https://get.docker.com | sh"
        ;;
      docker-compose-v2|docker)
        info "Docker Compose v2 ist seit Docker 23 eingebaut (docker compose)."
        ;;
    esac
    exit 1
  fi
}

check_cmd docker

# Compose v2 (Plugin) oder v1 (standalone)?
if docker compose version &>/dev/null 2>&1; then
  COMPOSE="docker compose"
  ok "docker compose (v2 Plugin) gefunden"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
  ok "docker-compose (v1) gefunden"
else
  err "Docker Compose nicht gefunden."
  info "Installation: sudo apt install docker-compose-plugin"
  exit 1
fi

# Docker-Daemon läuft?
if ! docker info &>/dev/null 2>&1; then
  err "Docker-Daemon läuft nicht."
  info "Starten: sudo systemctl start docker"
  info "Autostart: sudo systemctl enable docker"
  exit 1
fi
ok "Docker-Daemon läuft"

# Ports 80 und 443 frei?
for port in 80 443; do
  if ss -tlnp 2>/dev/null | grep -q ":${port} " || \
     netstat -tlnp 2>/dev/null | grep -q ":${port} "; then
    warn "Port ${port} ist bereits belegt – eventuell läuft schon ein Webserver."
    warn "Falls nginx/apache lokal läuft: sudo systemctl stop nginx apache2"
  fi
done

# ── Schritt 2: Domain & E-Mail abfragen ──────────────────────────────────────
step "Schritt 2/5: Domain & Kontaktdaten"

echo ""
info "Wichtig: Der A-Record deiner Domain muss bereits auf die IP"
info "dieses Servers zeigen, sonst schlägt die SSL-Ausstellung fehl."
echo ""

# Domain
while true; do
  read -rp "  Domain (z.B. hochzeit.mustermann.de): " DOMAIN
  DOMAIN="${DOMAIN,,}"          # Kleinbuchstaben
  DOMAIN="${DOMAIN#https://}"   # https:// entfernen falls eingefügt
  DOMAIN="${DOMAIN#http://}"
  DOMAIN="${DOMAIN%/}"          # Trailing slash entfernen
  if [[ "$DOMAIN" =~ ^[a-z0-9]([a-z0-9\-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]*[a-z0-9])?)+$ ]]; then
    ok "Domain: ${DOMAIN}"
    break
  else
    err "Ungültiges Format. Bitte eine gültige Domain eingeben (keine http://, kein Slash)."
  fi
done

# E-Mail für Let's Encrypt
while true; do
  read -rp "  E-Mail für SSL-Zertifikat (Let's Encrypt): " EMAIL
  if [[ "$EMAIL" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
    ok "E-Mail: ${EMAIL}"
    break
  else
    err "Ungültige E-Mail-Adresse."
  fi
done

# ── Schritt 3: .env schreiben ─────────────────────────────────────────────────
step "Schritt 3/5: Konfiguration speichern"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

cat > "$ENV_FILE" <<EOF
# Automatisch generiert von install.sh
# ── Domain & SSL ──────────────────────────────────────────────────────────────
DOMAIN=${DOMAIN}
LETSENCRYPT_EMAIL=${EMAIL}

# ── Backend-URL (wird ins Frontend eingebaut) ─────────────────────────────────
VITE_BACKEND_URL=https://${DOMAIN}
EOF

ok ".env geschrieben"
info "Inhalt:"
sed 's/^/       /' "$ENV_FILE"

# ── Schritt 4: DNS-Check (optional, nicht blockierend) ───────────────────────
step "Schritt 4/5: DNS-Auflösung prüfen"

SERVER_IP=""
if command -v curl &>/dev/null; then
  SERVER_IP=$(curl -sf --max-time 5 https://api.ipify.org 2>/dev/null || true)
fi

RESOLVED_IP=""
if command -v dig &>/dev/null; then
  RESOLVED_IP=$(dig +short "$DOMAIN" A 2>/dev/null | head -1 || true)
elif command -v nslookup &>/dev/null; then
  RESOLVED_IP=$(nslookup "$DOMAIN" 2>/dev/null | awk '/^Address: / { print $2; exit }' || true)
elif command -v host &>/dev/null; then
  RESOLVED_IP=$(host "$DOMAIN" 2>/dev/null | awk '/has address/ { print $4; exit }' || true)
fi

if [[ -n "$RESOLVED_IP" && -n "$SERVER_IP" ]]; then
  if [[ "$RESOLVED_IP" == "$SERVER_IP" ]]; then
    ok "DNS korrekt: ${DOMAIN} → ${RESOLVED_IP}"
  else
    warn "DNS-Konflikt: ${DOMAIN} zeigt auf ${RESOLVED_IP}, aber diese Server-IP ist ${SERVER_IP}."
    warn "SSL-Ausstellung wird fehlschlagen, bis der A-Record stimmt."
    echo ""
    read -rp "  Trotzdem fortfahren? (j/N): " CONFIRM
    if [[ "${CONFIRM,,}" != "j" && "${CONFIRM,,}" != "ja" ]]; then
      info "Abgebrochen. DNS korrigieren und install.sh erneut ausführen."
      exit 0
    fi
  fi
elif [[ -n "$RESOLVED_IP" ]]; then
  info "Domain löst auf: ${RESOLVED_IP} (eigene IP konnte nicht ermittelt werden)"
else
  warn "DNS-Check nicht möglich (dig/nslookup nicht verfügbar oder keine Antwort)."
fi

# ── Schritt 5: Docker Compose starten ────────────────────────────────────────
step "Schritt 5/5: Container bauen und starten"

cd "$SCRIPT_DIR"

info "Baue Images... (kann 2–5 Minuten dauern)"
echo ""
$COMPOSE build --no-cache

echo ""
info "Starte Container..."
$COMPOSE up -d

echo ""
info "Warte auf den Health-Check des Backends..."
TRIES=0
MAX=30
until $COMPOSE exec -T backend wget -qO- http://localhost:3001/health &>/dev/null; do
  TRIES=$((TRIES + 1))
  if [[ $TRIES -ge $MAX ]]; then
    err "Backend antwortet nicht nach ${MAX} Versuchen."
    err "Logs prüfen: $COMPOSE logs backend"
    exit 1
  fi
  sleep 2
  printf "."
done
echo ""
ok "Backend läuft"

# ── Fertig ────────────────────────────────────────────────────────────────────
echo ""
hr
echo -e "${BOLD}${GREEN}  ✓  Installation abgeschlossen!${NC}"
hr
echo ""
echo -e "  ${BOLD}Gäste-URL:${NC}      https://${DOMAIN}"
echo -e "  ${BOLD}Moderator-URL:${NC}  https://${DOMAIN}/moderator"
echo ""
echo -e "  ${CYAN}Tipp:${NC} Caddy holt sich das SSL-Zertifikat beim ersten Aufruf"
echo -e "       automatisch – das kann 10–30 Sekunden dauern."
echo ""
info "Nützliche Befehle:"
echo "    Logs live verfolgen:   $COMPOSE logs -f"
echo "    Status prüfen:         $COMPOSE ps"
echo "    App stoppen:           $COMPOSE down"
echo "    App neu starten:       $COMPOSE restart"
echo ""
hr
