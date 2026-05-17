# Schuhspiel – Patrick & Theresa 💍

Real-time Hochzeitsspiel: Gäste stimmen live per Smartphone ab, während das Brautpaar Rücken an Rücken sitzt.

## Architektur

```
Browser (Gäste/Moderator)
        │ HTTPS
        ▼
   Caddy :443          ← SSL-Terminierung + Reverse Proxy (automatisch Let's Encrypt)
   ├── /socket.io/* → backend:3001  (Node.js + Socket.io)
   └── /*           → frontend:80  (nginx, React-App)
```

Kein externer Dienst, kein Cloud-Abo – alles läuft im Docker-Netzwerk auf deinem vServer.

---

## Deployment auf dem vServer

### Variante A: Geführtes Installationsskript (empfohlen)

```bash
git clone <dieses-repo> hochzeit && cd hochzeit
bash install.sh
```

Das Skript:
1. prüft Docker & Docker Compose
2. fragt Domain + E-Mail interaktiv ab
3. schreibt `.env` automatisch
4. prüft den DNS-A-Record
5. baut alle Images und startet die Container
6. wartet auf den Health-Check und zeigt die fertigen URLs

**Voraussetzung:** A-Record der Domain zeigt bereits auf die vServer-IP.

---

### Variante B: Manuell

**1. `.env` befüllen**

```env
DOMAIN=hochzeit.beispiel.de
LETSENCRYPT_EMAIL=deine@email.de
VITE_BACKEND_URL=https://hochzeit.beispiel.de
```

**2. Bauen und starten**

```bash
docker compose up -d --build
```

**3. URLs**

| Rolle      | URL                                    |
|------------|----------------------------------------|
| Gäste      | `https://hochzeit.beispiel.de`         |
| Moderator  | `https://hochzeit.beispiel.de/moderator` |

> SSL-Zertifikat wird beim ersten Aufruf automatisch von Caddy/Let's Encrypt geholt (~10–30 Sek.).

---

## Lokale Entwicklung (ohne Docker)

Node.js 18+ erforderlich.

```bash
# Terminal 1 – Backend
cd backend && npm install && npm run dev

# Terminal 2 – Frontend
cd frontend && npm install && npm run dev
```

Frontend: http://localhost:5173
Moderator: http://localhost:5173/moderator

---

## Spielablauf

1. Gäste öffnen die App → Name + Farbe wählen → Lobby
2. Moderator sieht alle verbundenen Gäste → **Spiel starten**
3. Pro Frage: Gäste tippen Patrick oder Theresa → Moderator klickt **Auswertung anzeigen** → Ergebnisse mit farbigen Namens-Badges → **Nächste Frage**
4. Nach 16 Fragen: Abschlussscreen

---

## Nützliche Befehle

```bash
docker compose logs -f          # Live-Logs aller Container
docker compose logs caddy       # Nur Caddy (SSL-Fehler, Zertifikat-Status)
docker compose ps               # Status aller Container
docker compose restart          # Neustart ohne Rebuild
docker compose down             # Alles stoppen (Zertifikate bleiben im Volume)
docker compose down -v          # Alles + Volumes löschen (Zertifikate weg!)
```

---

## Tech Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS 3, React Router 6, socket.io-client
- **Backend:** Node.js, Express 4, Socket.io 4 (In-Memory-State)
- **Reverse Proxy:** Caddy 2 (automatisches HTTPS via Let's Encrypt)
- **Infra:** Docker, Docker Compose, nginx (statisches Frontend-Serving)
