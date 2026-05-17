import React from "react";
import { useSocket } from "../../context/SocketContext";

// ── Reusable badge ────────────────────────────────────────────────────────────
function Badge({ name, color }) {
  return (
    <span
      className="inline-block px-3 py-1.5 rounded-full text-sm font-semibold text-surface m-1"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  );
}

// ── Lobby view ────────────────────────────────────────────────────────────────
function ModLobby({ gameState, modStartGame }) {
  const participants = gameState?.participants ?? [];
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-1">
        <h1 className="font-serif text-4xl italic text-white">Patrick & Theresa</h1>
        <p className="text-surface-3 text-sm tracking-widest uppercase">Schuhspiel – Moderator</p>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Verbundene Gäste</h2>
          <span className="text-surface-3 text-sm">{participants.length} Personen</span>
        </div>

        <div className="min-h-[100px] flex flex-wrap content-start">
          {participants.length === 0 ? (
            <p className="text-surface-3 text-sm w-full text-center py-6">
              Noch niemand verbunden. Gäste können jetzt beitreten.
            </p>
          ) : (
            participants.map((p) => <Badge key={p.id} name={p.name} color={p.color} />)
          )}
        </div>
      </div>

      <button
        onClick={modStartGame}
        disabled={participants.length === 0}
        className="btn-primary w-full bg-emerald-500 hover:bg-emerald-400 text-white text-lg py-4"
      >
        Spiel starten →
      </button>
    </div>
  );
}

// ── Voting control ────────────────────────────────────────────────────────────
function ModVoting({ gameState, modShowEvaluation }) {
  const qi = gameState?.currentQuestionIndex ?? 0;
  const total = gameState?.totalQuestions ?? 16;
  const voted = gameState?.voteCount ?? 0;
  const count = gameState?.participantCount ?? 0;
  const pct = count > 0 ? Math.round((voted / count) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <span className="text-surface-3 text-sm">Frage {qi + 1} / {total}</span>
        <div className="flex-1 h-1 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${((qi + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="card p-8 text-center space-y-3">
        <p className="text-surface-3 text-xs uppercase tracking-widest">Aktuelle Frage</p>
        <h2 className="font-serif text-3xl italic text-white">{gameState?.question}</h2>
      </div>

      <div className="card p-6 space-y-3">
        <div className="flex items-end justify-between">
          <p className="text-white font-semibold">Abstimmung läuft</p>
          <p className="text-2xl font-bold text-white">{voted} <span className="text-surface-3 text-base font-normal">/ {count}</span></p>
        </div>
        <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-surface-3 text-xs text-right">{pct}% abgestimmt</p>
      </div>

      <button
        onClick={modShowEvaluation}
        className="btn-primary w-full bg-sky-500 hover:bg-sky-400 text-white text-lg py-4"
      >
        Auswertung anzeigen
      </button>
    </div>
  );
}

// ── Evaluation control ────────────────────────────────────────────────────────
function EvalColumn({ name, emoji, votes, total, color }) {
  const pct = total > 0 ? Math.round((votes.length / total) * 100) : 0;
  return (
    <div className="card p-4 flex-1">
      <div className="text-center mb-3">
        <span className="text-2xl">{emoji}</span>
        <p className="font-bold text-white">{name}</p>
        <p className="text-3xl font-serif font-bold" style={{ color }}>{pct}%</p>
        <p className="text-surface-3 text-xs">{votes.length} Stimmen</p>
      </div>
      <div className="h-1 bg-surface-2 rounded-full mb-3 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex flex-wrap justify-center">
        {votes.map((v) => <Badge key={v.id} name={v.name} color={v.color} />)}
        {votes.length === 0 && <p className="text-surface-3 text-xs py-2">Keine Stimmen</p>}
      </div>
    </div>
  );
}

function ModEvaluation({ gameState, modNextQuestion }) {
  const ev = gameState?.evaluation;
  const qi = gameState?.currentQuestionIndex ?? 0;
  const total = gameState?.totalQuestions ?? 16;
  const isLast = qi >= total - 1;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card p-5 text-center">
        <p className="text-surface-3 text-xs uppercase tracking-widest mb-1">Auswertung · Frage {qi + 1}</p>
        <h2 className="font-serif text-2xl italic text-white">{ev?.question}</h2>
        <p className="text-surface-3 text-sm mt-2">{ev?.voted} von {ev?.total} Stimmen abgegeben</p>
      </div>

      <div className="flex gap-4">
        <EvalColumn name="Patrick" emoji="👔" votes={ev?.patrick ?? []} total={ev?.voted ?? 0} color="#38bdf8" />
        <EvalColumn name="Theresa" emoji="👗" votes={ev?.theresa ?? []} total={ev?.voted ?? 0} color="#f472b6" />
      </div>

      <button
        onClick={modNextQuestion}
        className={`btn-primary w-full text-white text-lg py-4 ${
          isLast ? "bg-rose-500 hover:bg-rose-400" : "bg-emerald-500 hover:bg-emerald-400"
        }`}
      >
        {isLast ? "Spiel beenden 🎉" : "Nächste Frage →"}
      </button>
    </div>
  );
}

// ── Finished ──────────────────────────────────────────────────────────────────
function ModFinished({ modResetGame }) {
  return (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="text-6xl">🎉</div>
      <h2 className="font-serif text-3xl italic text-white">Spiel beendet!</h2>
      <p className="text-surface-3">Herzlichen Glückwunsch an Patrick & Theresa!</p>
      <button
        onClick={modResetGame}
        className="btn-primary bg-surface-2 hover:bg-surface-3 text-white"
      >
        Neues Spiel starten
      </button>
    </div>
  );
}

// ── Main Moderator View ───────────────────────────────────────────────────────
export default function ModeratorScreen() {
  const { gameState, connected, modStartGame, modShowEvaluation, modNextQuestion, modResetGame } =
    useSocket();

  const status = gameState?.status ?? "LOBBY";

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Connection indicator */}
        <div className="flex justify-end">
          <span
            className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full ${
              connected ? "bg-emerald-900/40 text-emerald-400" : "bg-rose-900/40 text-rose-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-rose-400"}`}
            />
            {connected ? "Verbunden" : "Getrennt"}
          </span>
        </div>

        {status === "LOBBY" && <ModLobby gameState={gameState} modStartGame={modStartGame} />}
        {status === "VOTING" && <ModVoting gameState={gameState} modShowEvaluation={modShowEvaluation} />}
        {status === "EVALUATION" && (
          <ModEvaluation gameState={gameState} modNextQuestion={modNextQuestion} />
        )}
        {status === "FINISHED" && <ModFinished modResetGame={modResetGame} />}
      </div>
    </div>
  );
}
