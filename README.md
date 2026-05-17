# Schuhspiel – Patrick & Theresa 💍

Real-time wedding game web app. Guests vote live on their smartphones while the couple sits back-to-back with shoes.

## Architecture

```
frontend (React + Vite + Tailwind)  ←→  backend (Node.js + Socket.io)
         nginx:80                              express:3001
```

All real-time state is managed in-memory on the backend via Socket.io. No external database required.

## Deployment (vServer)

### 1. Set your server's IP/domain in `.env`

```env
VITE_BACKEND_URL=http://YOUR_SERVER_IP:3001
BACKEND_PORT=3001
FRONTEND_PORT=80
```

> If you use HTTPS/reverse proxy (nginx, Caddy), set `VITE_BACKEND_URL=https://yourdomain.com` and proxy `/socket.io` to port 3001.

### 2. Build and start

```bash
docker compose up -d --build
```

### 3. Access

| Role        | URL                            |
|-------------|--------------------------------|
| Guests      | `http://YOUR_SERVER_IP`        |
| Moderator   | `http://YOUR_SERVER_IP/moderator` |

Share the guest URL as a QR code. Open the moderator URL on your laptop/tablet.

## Local development (without Docker)

Requires Node.js 18+.

```bash
# Terminal 1 – Backend
cd backend && npm install && npm run dev

# Terminal 2 – Frontend
cd frontend && npm install && npm run dev
```

Frontend: http://localhost:5173  
Moderator: http://localhost:5173/moderator

## Game flow

1. Guests open the app → enter name + pick color → join lobby
2. Moderator sees all connected guests → clicks **Spiel starten**
3. For each question: guests vote Patrick or Theresa → moderator clicks **Auswertung anzeigen** → results with colored name badges → **Nächste Frage**
4. After 16 questions: finished screen

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS 3, React Router 6, socket.io-client
- **Backend:** Node.js, Express, Socket.io 4
- **Infra:** Docker, Docker Compose, nginx (serving built frontend)
