const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const questions = require("./questions");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// ── In-memory state ───────────────────────────────────────────────────────────
let gameState = {
  status: "LOBBY",           // LOBBY | VOTING | EVALUATION | FINISHED
  currentQuestionIndex: 0,
  timerDuration: 0,          // seconds per question (0 = no timer)
  timerEndsAt: null,         // epoch ms, null = no active timer
};

const participants = new Map(); // id → { id, name, colorBase, colorAccent }
const votes = new Map();        // questionIndex → Map<participantId, "Patrick"|"Theresa">

// ── Helpers ───────────────────────────────────────────────────────────────────
function getVotesForQuestion(index) {
  return votes.get(index) || new Map();
}

function buildEvaluationPayload(questionIndex) {
  const qVotes = getVotesForQuestion(questionIndex);
  const patrick = [], theresa = [];
  for (const [pid, vote] of qVotes.entries()) {
    const p = participants.get(pid);
    if (!p) continue;
    const entry = { id: p.id, name: p.name, colorBase: p.colorBase, colorAccent: p.colorAccent };
    if (vote === "Patrick") patrick.push(entry);
    else theresa.push(entry);
  }
  return { question: questions[questionIndex], questionIndex, patrick, theresa,
           total: participants.size, voted: qVotes.size };
}

function startTimerFor(questionIndex) {
  if (gameState.timerDuration > 0) {
    gameState.timerEndsAt = Date.now() + gameState.timerDuration * 1000;
  } else {
    gameState.timerEndsAt = null;
  }
}

function buildPayload() {
  const qVotes = getVotesForQuestion(gameState.currentQuestionIndex);
  const payload = {
    status: gameState.status,
    currentQuestionIndex: gameState.currentQuestionIndex,
    question: questions[gameState.currentQuestionIndex] || null,
    totalQuestions: questions.length,
    participantCount: participants.size,
    voteCount: qVotes.size,
    participants: Array.from(participants.values()),
    votedParticipantIds: Array.from(qVotes.keys()),
    timerDuration: gameState.timerDuration,
    timerEndsAt: gameState.timerEndsAt,
  };
  if (gameState.status === "EVALUATION" || gameState.status === "FINISHED") {
    payload.evaluation = buildEvaluationPayload(gameState.currentQuestionIndex);
  }
  return payload;
}

function broadcastState() {
  io.emit("state_update", buildPayload());
}

// ── Socket events ─────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  socket.emit("state_update", buildPayload());

  socket.on("join", ({ name, colorBase, colorAccent }) => {
    if (!name || !colorBase) return;
    const participant = { id: socket.id, name: name.trim().slice(0, 30),
                          colorBase, colorAccent: colorAccent || colorBase };
    participants.set(socket.id, participant);
    socket.emit("joined", participant);
    broadcastState();
  });

  socket.on("vote", ({ vote }) => {
    if (gameState.status !== "VOTING") return;
    if (vote !== "Patrick" && vote !== "Theresa") return;
    if (!participants.has(socket.id)) return;
    // Reject if timer has expired
    if (gameState.timerEndsAt && Date.now() > gameState.timerEndsAt) return;

    const qi = gameState.currentQuestionIndex;
    if (!votes.has(qi)) votes.set(qi, new Map());
    votes.get(qi).set(socket.id, vote);
    socket.emit("vote_ack", { vote, questionIndex: qi });
    broadcastState();
  });

  socket.on("mod_start_game", ({ timerDuration = 0 } = {}) => {
    if (gameState.status !== "LOBBY") return;
    gameState.status = "VOTING";
    gameState.currentQuestionIndex = 0;
    gameState.timerDuration = Math.max(0, parseInt(timerDuration) || 0);
    startTimerFor(0);
    broadcastState();
  });

  socket.on("mod_show_evaluation", () => {
    if (gameState.status !== "VOTING") return;
    gameState.status = "EVALUATION";
    gameState.timerEndsAt = null;
    broadcastState();
  });

  socket.on("mod_next_question", () => {
    if (gameState.status !== "EVALUATION") return;
    const next = gameState.currentQuestionIndex + 1;
    if (next >= questions.length) {
      gameState.status = "FINISHED";
      gameState.timerEndsAt = null;
    } else {
      gameState.currentQuestionIndex = next;
      gameState.status = "VOTING";
      startTimerFor(next);
    }
    broadcastState();
  });

  socket.on("mod_reset_game", () => {
    gameState = { status: "LOBBY", currentQuestionIndex: 0, timerDuration: 0, timerEndsAt: null };
    votes.clear();
    broadcastState();
  });

  socket.on("disconnect", () => {
    participants.delete(socket.id);
    broadcastState();
  });
});

app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Schuhspiel backend running on port ${PORT}`));
