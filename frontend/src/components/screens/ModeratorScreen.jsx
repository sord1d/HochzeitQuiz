import React from "react";
import { useSocket } from "../../context/SocketContext";

function Badge({ name, color, dim = false }) {
  return (
    <span
      className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold text-surface m-1 transition-all duration-300 ${
        dim ? "opacity-30 grayscale" : ""
      }`}
      style={{
        backgroundColor: color,
        boxShadow: dim ? "none" : `0 2px 8px ${color}40`,
      }}
    >
      {name}
    </span>
  );
}

// ── Lobby ─────────────────────────────────────────────────────────────────────
function ModLobby({ gameState, modStartGame }) {
  const participants = gameState?.participants ?? [];
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <p className="ornament">Moderator</p>
        <h1 className="font-serif text-5xl italic text-white leading-tight">
          Patrick<br />&amp; Theresa
        </h1>
        <p className="text-gold/50 text-sm tracking-widest">Das Schuhspiel</p>
      </div>

      <div className="card-gold p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Verbundene Gäste</h2>
          <span
            className="text-xs px-3 py-1 rounded-full font-bold"
            style={{ backgroundColor: "rgba(212,175,95,0.15)", color: "#d4af5f" }}
          >
            {participants.length} Personen
          </span>
        </div>

        <div className="min-h-[80px] flex flex-wrap content-start">
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
        className="btn-primary w-full text-surface font-bold text-lg py-4"
        style={{ background: "linear-gradient(135deg, #d4af5f, #b8943a)" }}
      >
        Spiel starten →
      </button>
    </div>
  );
}

// ── Voting ────────────────────────────────────────────────────────────────────
function ModVoting({ gameState, modShowEvaluation }) {
  const qi = gameState?.currentQuestionIndex ?? 0;
  const total = gameState?.totalQuestions ?? 16;
  const voted = gameState?.voteCount ?? 0;
  const count = gameState?.participantCount ?? 0;
  const pct = count > 0 ? Math.round((voted / count) * 100) : 0;
  const participants = gameState?.participants ?? [];
  const votedIds = new Set(gameState?.votedParticipantIds ?? []);

  const votedList = participants.filter((p) => votedIds.has(p.id));
  const pendingList = participants.filter((p) => !votedIds.has(p.id));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-gold/50 text-xs tracking-widest shrink-0">
          Frage {qi + 1} / {total}
        </span>
        <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((qi + 1) / total) * 100}%`,
              background: "linear-gradient(90deg, #d4af5f, #e8c97a)",
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="card-gold p-7 text-center space-y-2">
        <p className="ornament">Aktuelle Frage</p>
        <h2 className="font-serif text-3xl italic text-white">{gameState?.question}</h2>
      </div>

      {/* Vote progress */}
      <div className="card p-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <p className="text-white font-semibold">Abstimmung läuft</p>
          <p className="text-3xl font-bold text-white">
            {voted}
            <span className="text-surface-3 text-lg font-normal"> / {count}</span>
          </p>
        </div>

        {/* Bar */}
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100
                ? "linear-gradient(90deg, #4ade80, #34d399)"
                : "linear-gradient(90deg, #38bdf8, #818cf8)",
            }}
          />
        </div>

        {/* Who voted / who hasn't */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-emerald-400/70 font-medium mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Abgestimmt ({votedList.length})
            </p>
            <div className="flex flex-wrap">
              {votedList.map((p) => (
                <Badge key={p.id} name={p.name} color={p.color} />
              ))}
              {votedList.length === 0 && (
                <p className="text-surface-3 text-xs py-1">Noch niemand</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-surface-3 font-medium mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-surface-2 inline-block" />
              Ausstehend ({pendingList.length})
            </p>
            <div className="flex flex-wrap">
              {pendingList.map((p) => (
                <Badge key={p.id} name={p.name} color={p.color} dim />
              ))}
              {pendingList.length === 0 && (
                <p className="text-emerald-400/60 text-xs py-1">Alle fertig ✓</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={modShowEvaluation}
        className="btn-primary w-full text-white font-bold text-lg py-4 bg-sky-600 hover:bg-sky-500"
      >
        Auswertung anzeigen
      </button>
    </div>
  );
}

// ── Evaluation ────────────────────────────────────────────────────────────────
function EvalColumn({ name, emoji, votes, total, color }) {
  const pct = total > 0 ? Math.round((votes.length / total) * 100) : 0;
  return (
    <div className="card flex-1 p-4 space-y-3">
      <div className="text-center">
        <span className="text-2xl">{emoji}</span>
        <p className="font-bold text-white mt-1">{name}</p>
        <p
          className="text-4xl font-serif font-bold leading-none my-2"
          style={{ color, textShadow: `0 0 20px ${color}50` }}
        >
          {pct}%
        </p>
        <p className="text-surface-3 text-xs">{votes.length} Stimmen</p>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex flex-wrap justify-center">
        {votes.map((v) => <Badge key={v.id} name={v.name} color={v.color} />)}
        {votes.length === 0 && (
          <p className="text-surface-3 text-xs py-2">Keine Stimmen</p>
        )}
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
      <div className="card-gold p-6 text-center space-y-2">
        <p className="ornament">Auswertung · Frage {qi + 1}</p>
        <h2 className="font-serif text-2xl italic text-white">{ev?.question}</h2>
        <p className="text-gold/50 text-sm">{ev?.voted} von {ev?.total} Stimmen</p>
      </div>

      <div className="flex gap-4">
        <EvalColumn name="Patrick" emoji="👔" votes={ev?.patrick ?? []} total={ev?.voted ?? 0} color="#38bdf8" />
        <EvalColumn name="Theresa" emoji="👗" votes={ev?.theresa ?? []} total={ev?.voted ?? 0} color="#f472b6" />
      </div>

      <button
        onClick={modNextQuestion}
        className={`btn-primary w-full text-white font-bold text-lg py-4 ${
          isLast ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500"
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
    <div className="text-center space-y-6 animate-fade-in py-12">
      <div className="text-6xl">💍</div>
      <div className="space-y-2">
        <p className="ornament">Das war's!</p>
        <h2 className="font-serif text-4xl italic text-white">Spiel beendet!</h2>
        <p className="text-gold/50">Herzlichen Glückwunsch an Patrick & Theresa!</p>
      </div>
      <button
        onClick={modResetGame}
        className="btn-primary bg-surface-2 hover:bg-surface-3 text-white mt-4"
      >
        Neues Spiel starten
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ModeratorScreen() {
  const { gameState, connected, modStartGame, modShowEvaluation, modNextQuestion, modResetGame } =
    useSocket();

  const status = gameState?.status ?? "LOBBY";

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-end">
          <span
            className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full ${
              connected
                ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-900/30 text-rose-400 border border-rose-500/20"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-rose-400"}`} />
            {connected ? "Verbunden" : "Getrennt"}
          </span>
        </div>

        {status === "LOBBY"      && <ModLobby      gameState={gameState} modStartGame={modStartGame} />}
        {status === "VOTING"     && <ModVoting      gameState={gameState} modShowEvaluation={modShowEvaluation} />}
        {status === "EVALUATION" && <ModEvaluation  gameState={gameState} modNextQuestion={modNextQuestion} />}
        {status === "FINISHED"   && <ModFinished    modResetGame={modResetGame} />}
      </div>
    </div>
  );
}
