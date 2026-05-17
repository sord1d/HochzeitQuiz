import React, { useState, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import { useCountdown } from "../../hooks/useCountdown";
import { useTimerSounds } from "../../hooks/useTimerSounds";
import { unlockAudio } from "../../audio";
import { Badge } from "../Badge";

// ── Animated percentage number ────────────────────────────────────────────────
function useAnimatedPct(target) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    setValue(0);
    const t = setTimeout(() => setValue(target), 200);
    return () => clearTimeout(t);
  }, [target]);
  return value;
}

// ── Circular countdown ────────────────────────────────────────────────────────
function TimerCircle({ remaining, total }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct  = total > 0 ? remaining / total : 0;
  const color = remaining > total * 0.5 ? "#4ade80"
              : remaining > total * 0.2 ? "#facc15"
              : "#f43f5e";
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" className="-rotate-90 absolute inset-0">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.3s linear, stroke 0.5s" }} />
      </svg>
      <span className="text-5xl font-bold tabular-nums relative z-10" style={{ color }}>
        {remaining}
      </span>
    </div>
  );
}

// ── Large timer for beamer voting ─────────────────────────────────────────────
function TimerCircleLarge({ remaining, total }) {
  const size = 300;
  const cx   = size / 2;
  const r    = 115;
  const circ = 2 * Math.PI * r;
  const pct  = total > 0 ? remaining / total : 0;
  const color = remaining > total * 0.5 ? "#4ade80"
              : remaining > total * 0.2 ? "#facc15"
              : "#f43f5e";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: "visible" }}>
      {/* Ring rotated within SVG coordinate space — no CSS transform on the SVG itself */}
      <g transform={`rotate(-90 ${cx} ${cx})`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.3s linear, stroke 0.5s",
                   filter: `drop-shadow(0 0 20px ${color})` }} />
      </g>
      {/* Number centred in SVG — same coordinate space, no alignment bugs */}
      <text x={cx} y={cx}
        textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="108" fontWeight="700"
        style={{ filter: `drop-shadow(0 0 30px ${color}80)` }}>
        {remaining}
      </text>
    </svg>
  );
}

// ── Evaluation column ─────────────────────────────────────────────────────────
function EvalSide({ name, emoji, votes, total, accentColor, winner }) {
  const pct     = total > 0 ? Math.round((votes.length / total) * 100) : 0;
  const animPct = useAnimatedPct(pct);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-between py-8 px-10 gap-5 relative overflow-hidden"
      style={{
        backgroundColor: `${accentColor}${winner ? "15" : "08"}`,
        borderRight: accentColor === "#38bdf8" ? `1px solid rgba(255,255,255,0.07)` : "none",
        transition: "background-color 1.2s ease",
      }}
    >
      {/* Winner glow — stronger, two layers */}
      {winner && (<>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${accentColor}28, transparent 70%)` }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 60% 40% at 50% 100%, ${accentColor}10, transparent 70%)` }} />
      </>)}

      {/* Name + emoji */}
      <div className="text-center space-y-2 relative z-10">
        <div style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}>{emoji}</div>
        <p className="font-serif italic text-white tracking-wide"
          style={{ fontSize: "clamp(1.6rem, 3.5vw, 3rem)" }}>
          {name}
        </p>
        {winner && (
          <span className="inline-block text-sm px-4 py-1 rounded-full font-semibold tracking-wider"
            style={{ backgroundColor: `${accentColor}25`, color: accentColor,
                     boxShadow: `0 0 16px ${accentColor}40` }}>
            Mehrheit ✓
          </span>
        )}
      </div>

      {/* Big percentage */}
      <div className="relative z-10 text-center leading-none">
        <p className="font-serif"
          style={{
            fontSize: "clamp(4.5rem, 11vw, 9rem)",
            color: accentColor,
            textShadow: `0 0 80px ${accentColor}60, 0 0 20px ${accentColor}30`,
          }}>
          {animPct}%
        </p>
        <p className="text-white/35 text-xl mt-1">
          {votes.length} Stimme{votes.length !== 1 ? "n" : ""}
        </p>
      </div>

      {/* Name badges */}
      <div className="flex flex-wrap justify-center gap-1 relative z-10 overflow-y-auto max-h-36 w-full">
        {votes.map((v, i) => (
          <Badge key={v.id} name={v.name} colorBase={v.colorBase} colorAccent={v.colorAccent}
            size="md" index={i} />
        ))}
        {votes.length === 0 && <p className="text-white/20 text-base">Keine Stimmen</p>}
      </div>
    </div>
  );
}

// ── Lobby ─────────────────────────────────────────────────────────────────────
function BeamerLobby({ gameState }) {
  const participants = gameState?.participants ?? [];
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-12 animate-fade-in">
      <div className="text-center space-y-3">
        <p className="ornament text-base tracking-[0.5em]">Herzlich Willkommen</p>
        <h1 className="font-serif italic text-white leading-none"
          style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}>
          Patrick &amp; Theresa
        </h1>
        <p className="text-gold/60 text-xl tracking-widest uppercase">Das Schuhspiel</p>
      </div>

      {participants.length > 0 && (
        <div className="flex flex-wrap justify-center max-w-4xl gap-1">
          {participants.map((p, i) => (
            <Badge key={p.id} name={p.name} colorBase={p.colorBase} colorAccent={p.colorAccent}
              size="md" index={i} />
          ))}
        </div>
      )}

      <p className="text-white/30 text-lg">
        {participants.length} Gäste verbunden · Warten auf den Start...
      </p>
    </div>
  );
}

// ── Voting ────────────────────────────────────────────────────────────────────
function BeamerVoting({ gameState }) {
  const qi       = gameState?.currentQuestionIndex ?? 0;
  const total    = gameState?.totalQuestions ?? 16;
  const voted    = gameState?.voteCount ?? 0;
  const count    = gameState?.participantCount ?? 0;
  const pct      = count > 0 ? Math.round((voted / count) * 100) : 0;
  const timerEndsAt = gameState?.timerEndsAt ?? null;
  const remaining = useCountdown(timerEndsAt);
  const duration  = gameState?.timerDuration ?? 0;
  useTimerSounds(remaining);

  const timerActive  = timerEndsAt !== null;
  const timerExpired = timerActive && remaining === 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-12 animate-fade-in">
      {/* Progress */}
      <div className="w-full max-w-4xl space-y-2 shrink-0">
        <div className="flex justify-between text-sm text-gold/50 tracking-widest uppercase">
          <span>Frage {qi + 1} von {total}</span>
          <span>{voted} / {count} Stimmen</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${((qi + 1) / total) * 100}%`,
                     background: "linear-gradient(90deg, #d4af5f, #e8c97a)" }} />
        </div>
      </div>

      {/* Question — always visible */}
      <div className="card-gold p-10 text-center space-y-4 w-full max-w-4xl shrink-0">
        <p className="ornament">Wer von beiden...</p>
        <h2 className="font-serif italic text-white leading-snug"
          style={{ fontSize: "clamp(1.8rem, 4vw, 3.5rem)" }}>
          {gameState?.question}
        </h2>
      </div>

      {/* Timer / waiting — cross-fade */}
      {timerActive && (
        <div className="relative flex items-center justify-center shrink-0" style={{ height: 300 }}>
          {/* Countdown — fades out at zero */}
          <div style={{ opacity: timerExpired ? 0 : 1, transition: "opacity 0.8s ease",
                        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {remaining !== null && <TimerCircleLarge remaining={remaining} total={duration} />}
          </div>
          {/* Waiting — fades in at zero */}
          <div style={{ opacity: timerExpired ? 1 : 0, transition: "opacity 0.8s ease 0.4s",
                        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 16 }}>
            <p className="text-white/60 tracking-widest whitespace-nowrap"
               style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
              Abstimmung beendet
            </p>
            <p className="text-gold/50 tracking-[0.3em] whitespace-nowrap uppercase text-sm">
              Warten auf Auswertung...
            </p>
          </div>
        </div>
      )}

      {/* Vote progress bar */}
      <div className="w-full max-w-4xl shrink-0">
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100
                ? "linear-gradient(90deg,#4ade80,#34d399)"
                : "linear-gradient(90deg,#38bdf8,#818cf8)",
            }} />
        </div>
      </div>
    </div>
  );
}

// ── Evaluation ────────────────────────────────────────────────────────────────
function BeamerEvaluation({ gameState }) {
  const ev = gameState?.evaluation;
  if (!ev) return null;
  const patrickWins = ev.patrick.length >= ev.theresa.length;
  const theresaWins = ev.theresa.length >= ev.patrick.length;
  const tie = ev.patrick.length === ev.theresa.length;

  const total      = ev.voted || 1;
  const patrickPct = useAnimatedPct(Math.round((ev.patrick.length / total) * 100));
  const theresaPct = useAnimatedPct(Math.round((ev.theresa.length / total) * 100));

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="shrink-0 px-10 pt-5 pb-4 text-center space-y-2 border-b border-white/5">
        <p className="ornament text-sm">Ergebnis · Frage {(gameState?.currentQuestionIndex ?? 0) + 1}</p>
        <h2 className="font-serif italic text-white" style={{ fontSize: "clamp(1.2rem, 2.5vw, 2rem)" }}>
          {ev.question}
        </h2>

        {/* Split bar — election-style */}
        <div className="flex h-3 rounded-full overflow-hidden mt-3 mx-auto max-w-2xl"
          style={{ gap: ev.voted > 0 && !tie ? 2 : 0 }}>
          <div style={{
            width: `${patrickPct}%`, backgroundColor: "#38bdf8",
            transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: patrickWins && !tie ? "0 0 12px #38bdf880" : "none",
          }} />
          <div style={{
            width: `${theresaPct}%`, backgroundColor: "#f472b6",
            transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: theresaWins && !tie ? "0 0 12px #f472b680" : "none",
          }} />
          {ev.voted === 0 && <div className="flex-1 bg-white/5" />}
        </div>
      </div>

      {/* Two columns */}
      <div className="flex-1 flex min-h-0">
        <EvalSide name="Patrick" emoji="👔" votes={ev.patrick}
          total={ev.voted} accentColor="#38bdf8"
          winner={!tie && patrickWins} />
        <EvalSide name="Theresa" emoji="👗" votes={ev.theresa}
          total={ev.voted} accentColor="#f472b6"
          winner={!tie && theresaWins} />
      </div>
    </div>
  );
}

// ── Finished ──────────────────────────────────────────────────────────────────
function BeamerFinished() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
      <div className="text-8xl">💍</div>
      <div className="text-center space-y-3">
        <p className="ornament text-base">Das Schuhspiel ist beendet</p>
        <h1 className="font-serif italic text-white" style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}>
          Patrick &amp; Theresa
        </h1>
        <p className="text-gold/50 text-xl">Herzlichen Glückwunsch! 🥂</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BeamerScreen() {
  const { gameState, connected } = useSocket();
  const status = gameState?.status ?? "LOBBY";

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface"
      onClick={unlockAudio}
      style={{ background: "#0f172a radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,175,95,0.07) 0%, transparent 60%)" }}>

      {/* Thin top bar */}
      <div className="shrink-0 flex items-center justify-between px-6 py-2 border-b border-white/5">
        <span className="font-serif italic text-gold/60 text-sm">Patrick &amp; Theresa · Schuhspiel</span>
        <span className={`flex items-center gap-1.5 text-xs ${connected ? "text-emerald-400/60" : "text-rose-400/60"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-rose-400"}`} />
          {connected ? "Live" : "Getrennt"}
        </span>
      </div>

      {status === "LOBBY"      && <BeamerLobby      gameState={gameState} />}
      {status === "VOTING"     && <BeamerVoting      gameState={gameState} />}
      {status === "EVALUATION" && <BeamerEvaluation  gameState={gameState} />}
      {status === "FINISHED"   && <BeamerFinished />}
    </div>
  );
}
