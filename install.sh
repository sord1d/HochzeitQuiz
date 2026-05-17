#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Schuhspiel – Geführte Installation
# Unterstützt zwei Modi:
#   caddy  → Caddy übernimmt SSL + Routing (empfohlen für Neuinstallationen)
#   nginx  → Nginx-Config für bestehenden Reverse Proxy generieren
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC}  $*"; }
info() { echo -e "${CYAN}ℹ${NC}  $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
err()  { echo -e "${RED}✗${NC}  $*" >&2; }
step() { echo -e "\n${BOLD}${BLUE}── $* ${NC}"; }
hr()   { echo -e "${BLUE}────────────────────────────────────────────────────${NC}"; }
ask()  { read -rp "  $1" "$2"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Banner ────────────────────────────────────────────────────────────────────
clear
echo -e "${BOLD}"
echo "   💍  Patrick & Theresa – Schuhspiel"
echo "       Installations-Assistent"
echo -e "${NC}"
hr; echo ""

# ── Schritt 1: Voraussetzungen ────────────────────────────────────────────────
step "Schritt 1/5: Voraussetzungen prüfen"

# Docker
if ! command -v docker &>/dev/null; then
  err "Docker nicht gefunden."
  info "Installation: curl -fsSL https://get.docker.com | sh"
  exit 1
fi
ok "docker $(docker --version | grep -oP '\d+\.\d+\.\d+')"

# Docker Daemon
if ! docker info &>/dev/null 2>&1; then
  err "Docker-Daemon läuft nicht."
  info "Starten: sudo systemctl start docker && sudo systemctl enable docker"
  exit 1
fi
ok "Docker-Daemon läuft"

# Compose v2 oder v1
if docker compose version &>/dev/null 2>&1; then
  COMPOSE="docker compose"
  ok "docker compose v2"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
  ok "docker-compose v1"
else
  err "Docker Compose nicht gefunden."
  info "Installation: sudo apt install docker-compose-plugin"
  exit 1
fi

# ── Schritt 2: Proxy-Modus erkennen & wählen ─────────────────────────────────
step "Schritt 2/5: Reverse-Proxy-Modus"

NGINX_RUNNING=false
CADDY_RUNNING=false

# systemd-Dienste prüfen
if systemctl is-active --quiet nginx 2>/dev/null; then NGINX_RUNNING=true; fi
if systemctl is-active --quiet caddy 2>/dev/null; then CADDY_RUNNING=true; fi

# Alternativ: Prozess prüfen
pgrep -x nginx &>/dev/null && NGINX_RUNNING=true || true
pgrep -x caddy &>/dev/null && CADDY_RUNNING=true || true

# Port 80/443 belegt → wahrscheinlich nginx/caddy
PORT_BLOCKED=false
for port in 80 443; do
  if ss -tlnp 2>/dev/null | grep -q ":${port} "; then
    PORT_BLOCKED=true
  fi
done

if $NGINX_RUNNING; then
  echo ""
  info "Nginx läuft bereits auf diesem Server."
  echo ""
  echo -e "  Verfügbare Modi:"
  echo -e "    ${BOLD}1)${NC} nginx  – Config-Snippet für deinen Nginx generieren ${CYAN}(empfohlen)${NC}"
  echo -e "    ${BOLD}2)${NC} caddy  – Caddy als eigenen Reverse Proxy starten"
  echo ""
  PROXY_MODE=""
  while [[ "$PROXY_MODE" != "1" && "$PROXY_MODE" != "2" ]]; do
    ask "Modus wählen [1/2]: " PROXY_MODE
  done
  [[ "$PROXY_MODE" == "1" ]] && PROXY_MODE="nginx" || PROXY_MODE="caddy"
elif $PORT_BLOCKED && ! $CADDY_RUNNING; then
  warn "Port 80 oder 443 ist bereits belegt, aber kein bekannter Proxy erkannt."
  warn "Im Caddy-Modus würden die Ports kollidieren."
  echo ""
  echo -e "  Verfügbare Modi:"
  echo -e "    ${BOLD}1)${NC} nginx  – Config-Snippet generieren (für bestehenden Proxy)"
  echo -e "    ${BOLD}2)${NC} caddy  – Caddy starten (nur wenn der blockierende Dienst gestoppt wird)"
  echo ""
  PROXY_MODE=""
  while [[ "$PROXY_MODE" != "1" && "$PROXY_MODE" != "2" ]]; do
    ask "Modus wählen [1/2]: " PROXY_MODE
  done
  [[ "$PROXY_MODE" == "1" ]] && PROXY_MODE="nginx" || PROXY_MODE="caddy"
else
  info "Kein aktiver Reverse Proxy erkannt → Caddy-Modus (automatisches HTTPS)."
  PROXY_MODE="caddy"
fi

ok "Modus: ${BOLD}${PROXY_MODE}${NC}"

# ── Schritt 3: Domain & E-Mail abfragen ──────────────────────────────────────
step "Schritt 3/5: Domain & Kontaktdaten"

echo ""
info "Der A-Record der Domain muss auf die IP dieses Servers zeigen."
echo ""

# Domain
while true; do
  ask "Domain (z.B. hochzeit.mustermann.de): " DOMAIN
  DOMAIN="${DOMAIN,,}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN%/}"
  if [[ "$DOMAIN" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]]; then
    ok "Domain: ${DOMAIN}"; break
  else
    err "Ungültiges Format (keine http://, kein Slash am Ende)."
  fi
done

# E-Mail (für SSL-Zertifikat)
while true; do
  ask "E-Mail für SSL-Zertifikat (Let's Encrypt): " EMAIL
  if [[ "$EMAIL" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
    ok "E-Mail: ${EMAIL}"; break
  else
    err "Ungültige E-Mail-Adresse."
  fi
done

# ── Schritt 4: Konfiguration schreiben ───────────────────────────────────────
step "Schritt 4/5: Konfiguration speichern"

# .env schreiben
cat > "${SCRIPT_DIR}/.env" <<EOF
# Automatisch generiert von install.sh – Modus: ${PROXY_MODE}
DOMAIN=${DOMAIN}
LETSENCRYPT_EMAIL=${EMAIL}
VITE_BACKEND_URL=https://${DOMAIN}
EOF
ok ".env geschrieben"

# ── Nginx-Modus: Site-Config generieren ──────────────────────────────────────
if [[ "$PROXY_MODE" == "nginx" ]]; then

  NGINX_CONF="/etc/nginx/sites-available/schuhspiel"
  NGINX_LINK="/etc/nginx/sites-enabled/schuhspiel"
  NGINX_CONF_LOCAL="${SCRIPT_DIR}/nginx-site.conf"

  # Certbot-Pfade vorbereiten
  SSL_CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
  SSL_KEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"

  cat > "$NGINX_CONF_LOCAL" <<NGINXEOF
# Schuhspiel – nginx-Site-Config
# Generiert von install.sh

# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate     ${SSL_CERT};
    ssl_certificate_key ${SSL_KEY};
    ssl_session_timeout 1d;
    ssl_session_cache   shared:SSL:10m;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # WebSocket-Support für Socket.io
    location /socket.io/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_read_timeout 86400s;
    }

    # React-Frontend
    location / {
        proxy_pass       http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINXEOF

  ok "Nginx-Config geschrieben: ${NGINX_CONF_LOCAL}"

  # SSL-Zertifikat holen (certbot), wenn noch nicht vorhanden
  if [[ ! -f "$SSL_CERT" ]]; then
    echo ""
    warn "SSL-Zertifikat für ${DOMAIN} noch nicht vorhanden."
    if command -v certbot &>/dev/null; then
      echo ""
      ask "Certbot-Zertifikat jetzt automatisch holen? (j/N): " GET_CERT
      if [[ "${GET_CERT,,}" == "j" || "${GET_CERT,,}" == "ja" ]]; then
        info "Certbot wird ausgeführt..."
        sudo certbot certonly --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive
        ok "Zertifikat erfolgreich geholt"
      else
        warn "SSL-Zertifikat muss vor Nginx-Aktivierung vorhanden sein."
        info "Manuell: sudo certbot certonly --nginx -d ${DOMAIN}"
      fi
    else
      warn "certbot nicht gefunden."
      info "Installation: sudo apt install certbot python3-certbot-nginx"
      info "Danach:       sudo certbot certonly --nginx -d ${DOMAIN}"
    fi
  else
    ok "SSL-Zertifikat bereits vorhanden: ${SSL_CERT}"
  fi

  # Config nach /etc/nginx/sites-available kopieren (mit sudo)
  if [[ -d "/etc/nginx/sites-available" ]]; then
    echo ""
    ask "Config nach ${NGINX_CONF} kopieren und aktivieren? (j/N): " ENABLE_SITE
    if [[ "${ENABLE_SITE,,}" == "j" || "${ENABLE_SITE,,}" == "ja" ]]; then
      sudo cp "$NGINX_CONF_LOCAL" "$NGINX_CONF"
      sudo ln -sf "$NGINX_CONF" "$NGINX_LINK"
      if sudo nginx -t; then
        sudo systemctl reload nginx
        ok "Nginx-Site aktiviert und Nginx neu geladen"
      else
        err "Nginx-Konfigurationsfehler – bitte manuell prüfen."
        err "sudo nginx -t"
        exit 1
      fi
    else
      info "Manuell aktivieren:"
      echo "    sudo cp ${NGINX_CONF_LOCAL} ${NGINX_CONF}"
      echo "    sudo ln -s ${NGINX_CONF} ${NGINX_LINK}"
      echo "    sudo nginx -t && sudo systemctl reload nginx"
    fi
  fi

fi

# ── DNS-Check ─────────────────────────────────────────────────────────────────
SERVER_IP=$(curl -sf --max-time 5 https://api.ipify.org 2>/dev/null || true)
RESOLVED_IP=$(dig +short "$DOMAIN" A 2>/dev/null | head -1 || true)

if [[ -n "$RESOLVED_IP" && -n "$SERVER_IP" ]]; then
  if [[ "$RESOLVED_IP" == "$SERVER_IP" ]]; then
    ok "DNS korrekt: ${DOMAIN} → ${RESOLVED_IP}"
  else
    warn "DNS: ${DOMAIN} → ${RESOLVED_IP}, aber Server-IP ist ${SERVER_IP}"
    warn "SSL-Ausstellung schlägt fehl, bis der A-Record stimmt."
    ask "Trotzdem fortfahren? (j/N): " DNS_CONFIRM
    [[ "${DNS_CONFIRM,,}" != "j" && "${DNS_CONFIRM,,}" != "ja" ]] && { info "Abgebrochen."; exit 0; }
  fi
fi

# ── Schritt 5: Container starten ──────────────────────────────────────────────
step "Schritt 5/5: Container bauen und starten"

cd "$SCRIPT_DIR"

if [[ "$PROXY_MODE" == "nginx" ]]; then
  COMPOSE_CMD="$COMPOSE -f docker-compose.yml -f docker-compose.nginx.yml"
else
  COMPOSE_CMD="$COMPOSE"
fi

info "Baue Images... (2–5 Minuten)"
$COMPOSE_CMD build --no-cache

info "Starte Container..."
$COMPOSE_CMD up -d

info "Warte auf Backend-Health-Check..."
TRIES=0
until $COMPOSE_CMD exec -T backend wget -qO- http://localhost:3001/health &>/dev/null; do
  TRIES=$((TRIES+1))
  [[ $TRIES -ge 30 ]] && { err "Backend antwortet nicht. Logs: $COMPOSE_CMD logs backend"; exit 1; }
  sleep 2; printf "."
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

if [[ "$PROXY_MODE" == "caddy" ]]; then
  info "Caddy holt das SSL-Zertifikat beim ersten Aufruf (~10–30 Sek.)."
else
  info "SSL läuft über deinen bestehenden Nginx."
  if [[ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
    warn "SSL-Zertifikat noch nicht vorhanden – Seite wird erst mit HTTPS erreichbar."
  fi
fi

echo ""
info "Nützliche Befehle:"
echo "    Logs live:     $COMPOSE_CMD logs -f"
echo "    Status:        $COMPOSE_CMD ps"
echo "    Neustart:      $COMPOSE_CMD restart"
echo "    Stoppen:       $COMPOSE_CMD down"
echo ""
hr
