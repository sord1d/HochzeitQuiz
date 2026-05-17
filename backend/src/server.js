const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const questions = require("./questions");

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// ── In-memory state ──────────────────────────────────────────────────────────
let gameState = {
  status: "LOBBY", // LOBBY | VOTING | EVALUATION | FINISHED
  currentQuestionIndex: 0,
};

// participants: Map<id, { id, name, color }>
const participants = new Map();

// votes: Map<questionIndex, Map<participantId, "Patrick"|"Theresa">>
const votes = new Map();

// ── Helpers ──────────────────────────────────────────────────────────────────
function getVotesForQuestion(index) {
  return votes.get(index) || new Map();
}

function buildEvaluationPayload(questionIndex) {
  const qVotes = getVotesForQuestion(questionIndex);
  const patrick = [];
  const theresa = [];

  for (const [pid, vote] of qVotes.entries()) {
    const p = participants.get(pid);
    if (!p) continue;
    if (vote === "Patrick") patrick.push({ id: p.id, name: p.name, color: p.color });
    else theresa.push({ id: p.id, name: p.name, color: p.color });
  }

  return {
    question: questions[questionIndex],
    questionIndex,
    patrick,
    theresa,
    total: participants.size,
    voted: qVotes.size,
  };
}

function broadcastState() {
  const payload = {
    status: gameState.status,
    currentQuestionIndex: gameState.currentQuestionIndex,
    question: questions[gameState.currentQuestionIndex] || null,
    totalQuestions: questions.length,
    participantCount: participants.size,
    voteCount: getVotesForQuestion(gameState.currentQuestionIndex).size,
    participants: Array.from(participants.values()),
  };

  if (gameState.status === "EVALUATION" || gameState.status === "FINISHED") {
    payload.evaluation = buildEvaluationPayload(gameState.currentQuestionIndex);
  }

  io.emit("state_update", payload);
}

// ── Socket events ─────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  // Send current state immediately on connect
  const initialPayload = {
    status: gameState.status,
    currentQuestionIndex: gameState.currentQuestionIndex,
    question: questions[gameState.currentQuestionIndex] || null,
    totalQuestions: questions.length,
    participantCount: participants.size,
    voteCount: getVotesForQuestion(gameState.currentQuestionIndex).size,
    participants: Array.from(participants.values()),
  };
  if (gameState.status === "EVALUATION" || gameState.status === "FINISHED") {
    initialPayload.evaluation = buildEvaluationPayload(gameState.currentQuestionIndex);
  }
  socket.emit("state_update", initialPayload);

  // ── Participant joins ──
  socket.on("join", ({ name, color }) => {
    if (!name || !color) return;
    const participant = { id: socket.id, name: name.trim().slice(0, 30), color };
    participants.set(socket.id, participant);
    socket.emit("joined", participant);
    broadcastState();
  });

  // ── Cast vote ──
  socket.on("vote", ({ vote }) => {
    if (gameState.status !== "VOTING") return;
    if (vote !== "Patrick" && vote !== "Theresa") return;
    if (!participants.has(socket.id)) return;

    const qi = gameState.currentQuestionIndex;
    if (!votes.has(qi)) votes.set(qi, new Map());
    votes.get(qi).set(socket.id, vote);

    // Acknowledge to voter
    socket.emit("vote_ack", { vote, questionIndex: qi });

    broadcastState();
  });

  // ── Moderator: start game ──
  socket.on("mod_start_game", () => {
    if (gameState.status !== "LOBBY") return;
    gameState.status = "VOTING";
    gameState.currentQuestionIndex = 0;
    broadcastState();
  });

  // ── Moderator: show evaluation ──
  socket.on("mod_show_evaluation", () => {
    if (gameState.status !== "VOTING") return;
    gameState.status = "EVALUATION";
    broadcastState();
  });

  // ── Moderator: next question ──
  socket.on("mod_next_question", () => {
    if (gameState.status !== "EVALUATION") return;
    const next = gameState.currentQuestionIndex + 1;
    if (next >= questions.length) {
      gameState.status = "FINISHED";
    } else {
      gameState.currentQuestionIndex = next;
      gameState.status = "VOTING";
    }
    broadcastState();
  });

  // ── Moderator: reset game ──
  socket.on("mod_reset_game", () => {
    gameState = { status: "LOBBY", currentQuestionIndex: 0 };
    votes.clear();
    broadcastState();
  });

  // ── Disconnect ──
  socket.on("disconnect", () => {
    participants.delete(socket.id);
    broadcastState();
  });
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Schuhspiel backend running on port ${PORT}`);
});
