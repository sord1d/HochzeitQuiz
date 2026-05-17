import React, { useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { Badge } from "../Badge";
import { useCountdown } from "../../hooks/useCountdown";

// ── Reset button mit Bestätigung ──────────────────────────────────────────────
function ResetButton({ onReset }) {
  const [confirm, setConfirm] = useState(false);
  const handleClick = () => {
    if (confirm) { onReset(); setConfirm(false); }
    else { setConfirm(true); setTimeout(() => setConfirm(false), 4000); }
  };
  return (
    <button onClick={handleClick}
      className={`text-xs px-3 py-1 rounded-full border transition-all duration-200 ${
        confirm
          ? "border-rose-500/60 text-rose-400 bg-rose-900/30"
          : "border-white/10 text-surface-3 hover:border-white/20 hover:text-white/60"
      }`}>
      {confirm ? "Sicher? Tippe nochmal →" : "↺ Reset"}
    </button>
  );
}

// ── Moderator countdown display ───────────────────────────────────────────────
function ModTimer({ timerEndsAt, timerDuration }) {
  const remaining = useCountdown(timerEndsAt);
  if (remaining === null) return null;

  const pct = timerDuration > 0 ? remaining / timerDuration : 0;
  const color = remaining > timerDuration * 0.5 ? "#4ade80"
              : remaining > timerDuration * 0.2 ? "#facc15"
              : "#f43f5e";

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border"
      style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-2xl font-bold tabular-nums shrink-0" style={{ color }}>
        {remaining}s
      </span>
      {remaining === 0 && (
        <span className="text-xs text-surface-3 shrink-0">Abgestimmt geschlossen</span>
      )}
    </div>
  );
}

// ── Lobby ─────────────────────────────────────────────────────────────────────
function ModLobby({ gameState, modStartGame }) {
  const participants = gameState?.participants ?? [];
  const [timerDuration, setTimerDuration] = useState(0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-3">
        <p className="ornament">Moderator</p>
        <h1 className="font-serif text-5xl italic text-white leading-tight">
          Patrick<br />&amp; Theresa
        </h1>
        <p className="text-gold/50 text-sm tracking-widest">Das Schuhspiel</p>
      </div>

      {/* Participants */}
      <div className="card-gold p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Verbundene Gäste</h2>
          <span className="text-xs px-3 py-1 rounded-full font-bold bg-gold-muted text-gold">
            {participants.length} Personen
          </span>
        </div>
        <div className="min-h-[80px] flex flex-wrap content-start">
          {participants.length === 0 ? (
            <p className="text-surface-3 text-sm w-full text-center py-6">
              Noch niemand verbunden. Gäste können jetzt beitreten.
            </p>
          ) : (
            participants.map((p) => (
              <Badge key={p.id} name={p.name} colorBase={p.colorBase} colorAccent={p.colorAccent} />
            ))
          )}
        </div>
      </div>

      {/* Timer selection */}
      <div className="card p-5 space-y-4">
        <p className="text-white font-semibold text-sm">Timer pro Frage</p>

        <div className="flex items-center gap-3">
          {/* Decrement */}
          <button onClick={() => setTimerDuration((v) => Math.max(0, v - 5))}
            className="w-10 h-10 rounded-xl border border-white/10 text-white font-bold text-lg
                       hover:border-white/30 active:scale-95 transition-all shrink-0">
            −
          </button>

          {/* Number input */}
          <div className="flex-1 relative">
            <input
              type="number" min="0" max="300"
              value={timerDuration}
              onChange={(e) => setTimerDuration(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-center text-2xl font-bold bg-white/5 border border-white/10
                         rounded-xl py-2 text-white focus:outline-none focus:border-gold/40
                         transition-colors [appearance:textfield]
                         [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-3 text-sm pointer-events-none">
              Sek
            </span>
          </div>

          {/* Increment */}
          <button onClick={() => setTimerDuration((v) => Math.min(300, v + 5))}
            className="w-10 h-10 rounded-xl border border-white/10 text-white font-bold text-lg
                       hover:border-white/30 active:scale-95 transition-all shrink-0">
            +
          </button>
        </div>

        {/* Quick presets */}
        <div className="flex gap-2 flex-wrap">
          {[0, 15, 30, 45, 60, 90].map((v) => (
            <button key={v} onClick={() => setTimerDuration(v)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                timerDuration === v
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-white/10 text-surface-3 hover:text-white hover:border-white/20"
              }`}>
              {v === 0 ? "Kein Timer" : `${v}s`}
            </button>
          ))}
        </div>

        {timerDuration > 0 && (
          <p className="text-xs text-gold/50 text-center">
            Schließt nach {timerDuration}s automatisch — Ergebnis zeigst du manuell.
            Soundeffekte ab 5s vor Ende.
          </p>
        )}
      </div>

      <button onClick={() => modStartGame(timerDuration)}
        disabled={participants.length === 0}
        className="btn-primary w-full text-white font-bold text-lg py-4"
        style={{ background: "linear-gradient(135deg, #d4af5f, #b8943a)" }}>
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
  const votedList   = participants.filter((p) =>  votedIds.has(p.id));
  const pendingList = participants.filter((p) => !votedIds.has(p.id));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <span className="text-gold/50 text-xs tracking-widest shrink-0">Frage {qi + 1} / {total}</span>
        <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${((qi + 1) / total) * 100}%`, background: "linear-gradient(90deg, #d4af5f, #e8c97a)" }} />
        </div>
      </div>

      <div className="card-gold p-7 text-center space-y-2">
        <p className="ornament">Aktuelle Frage</p>
        <h2 className="font-serif text-3xl italic text-white">{gameState?.question}</h2>
      </div>

      {/* Timer bar */}
      {gameState?.timerEndsAt && (
        <ModTimer timerEndsAt={gameState.timerEndsAt} timerDuration={gameState.timerDuration} />
      )}

      <div className="card p-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <p className="text-white font-semibold">Abstimmung läuft</p>
          <p className="text-3xl font-bold text-white">
            {voted}<span className="text-surface-3 text-lg font-normal"> / {count}</span>
          </p>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100
                ? "linear-gradient(90deg, #4ade80, #34d399)"
                : "linear-gradient(90deg, #38bdf8, #818cf8)",
            }} />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <p className="text-xs text-emerald-400/70 font-medium mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Abgestimmt ({votedList.length})
            </p>
            <div className="flex flex-wrap">
              {votedList.map((p) => (
                <Badge key={p.id} name={p.name} colorBase={p.colorBase} colorAccent={p.colorAccent} size="sm" />
              ))}
              {votedList.length === 0 && <p className="text-surface-3 text-xs py-1">Noch niemand</p>}
            </div>
          </div>
          <div>
            <p className="text-xs text-surface-3 font-medium mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-surface-2 inline-block" />
              Ausstehend ({pendingList.length})
            </p>
            <div className="flex flex-wrap">
              {pendingList.map((p) => (
                <Badge key={p.id} name={p.name} colorBase={p.colorBase} colorAccent={p.colorAccent} size="sm" dim />
              ))}
              {pendingList.length === 0 && <p className="text-emerald-400/60 text-xs py-1">Alle fertig ✓</p>}
            </div>
          </div>
        </div>
      </div>

      <button onClick={modShowEvaluation}
        className="btn-primary w-full text-white font-bold text-lg py-4 bg-sky-600 hover:bg-sky-500">
        Auswertung anzeigen
      </button>
    </div>
  );
}

// ── Evaluation ────────────────────────────────────────────────────────────────
function EvalColumn({ name, emoji, votes, total, color }) {
  const pct = total > 0 ? Math.round((votes.length / total) * 100) : 0;
  return (
    <div className="flex-1 rounded-2xl border p-4 space-y-3 backdrop-blur-sm"
      style={{
        backgroundColor: `${color}10`, borderColor: `${color}40`,
        boxShadow: `0 0 25px ${color}15, inset 0 1px 0 ${color}20`,
      }}>
      <div className="text-center">
        <span className="text-2xl">{emoji}</span>
        <p className="font-bold text-white mt-1">{name}</p>
        <p className="text-4xl font-serif font-bold leading-none my-2"
          style={{ color, textShadow: `0 0 20px ${color}50` }}>{pct}%</p>
        <p className="text-surface-3 text-xs">{votes.length} Stimmen</p>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex flex-wrap justify-center">
        {votes.map((v, i) => (
          <Badge key={v.id} name={v.name} colorBase={v.colorBase} colorAccent={v.colorAccent} size="md" index={i} />
        ))}
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
      <div className="card-gold p-6 text-center space-y-2">
        <p className="ornament">Auswertung · Frage {qi + 1}</p>
        <h2 className="font-serif text-2xl italic text-white">{ev?.question}</h2>
        <p className="text-gold/50 text-sm">{ev?.voted} von {ev?.total} Stimmen</p>
      </div>
      <div className="flex gap-4">
        <EvalColumn name="Patrick" emoji="👔" votes={ev?.patrick ?? []} total={ev?.voted ?? 0} color="#38bdf8" />
        <EvalColumn name="Theresa" emoji="👗" votes={ev?.theresa ?? []} total={ev?.voted ?? 0} color="#f472b6" />
      </div>
      <button onClick={modNextQuestion}
        className={`btn-primary w-full text-white font-bold text-lg py-4 ${
          isLast ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500"
        }`}>
        {isLast ? "Spiel beenden 🎉" : "Nächste Frage →"}
      </button>
    </div>
  );
}

function ModFinished({ modResetGame }) {
  return (
    <div className="text-center space-y-6 animate-fade-in py-12">
      <div className="text-6xl">💍</div>
      <div className="space-y-2">
        <p className="ornament">Das war's!</p>
        <h2 className="font-serif text-4xl italic text-white">Spiel beendet!</h2>
        <p className="text-gold/50">Herzlichen Glückwunsch an Patrick &amp; Theresa!</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ModeratorScreen() {
  const { gameState, connected, modStartGame, modShowEvaluation, modNextQuestion, modResetGame } =
    useSocket();
  const status = gameState?.status ?? "LOBBY";

  return (
    <div className="screen-scroll">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <ResetButton onReset={modResetGame} />
          <span className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${
            connected
              ? "border-emerald-500/20 text-emerald-400 bg-emerald-900/30"
              : "border-rose-500/20 text-rose-400 bg-rose-900/30"
          }`}>
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
