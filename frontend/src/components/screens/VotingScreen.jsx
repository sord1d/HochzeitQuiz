import React from "react";
import { useSocket } from "../../context/SocketContext";
import { badgeStyle } from "../Badge";
import { useCountdown } from "../../hooks/useCountdown";

// SVG countdown ring
function TimerRing({ remaining, total }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? remaining / total : 0;
  const dash = pct * circ;

  const color = remaining > total * 0.5
    ? "#4ade80"
    : remaining > total * 0.2
    ? "#facc15"
    : "#f43f5e";

  return (
    <div className="flex items-center justify-center gap-3 shrink-0">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.25s linear, stroke 0.5s" }}
        />
      </svg>
      <span className="text-3xl font-bold tabular-nums" style={{ color }}>
        {remaining}
      </span>
    </div>
  );
}

export default function VotingScreen() {
  const { gameState, participant, myVotes, vote } = useSocket();
  const qi = gameState?.currentQuestionIndex ?? 0;
  const question = gameState?.question ?? "";
  const total = gameState?.totalQuestions ?? 16;
  const hasVoted = myVotes[qi] !== undefined;
  const myChoice = myVotes[qi];

  const timerEndsAt = gameState?.timerEndsAt ?? null;
  const timerDuration = gameState?.timerDuration ?? 0;
  const remaining = useCountdown(timerEndsAt);
  const timerActive = timerEndsAt !== null;
  const timerExpired = timerActive && remaining === 0;
  const votingClosed = hasVoted || timerExpired;

  return (
    <div className="screen animate-fade-in gap-3">

      {/* Progress */}
      <div className="shrink-0 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gold/60 text-xs tracking-widest">Frage {qi + 1} / {total}</span>
          {participant && (
            <span className="px-3 py-1 rounded-full font-bold text-white text-xs"
              style={badgeStyle(participant.colorBase, participant.colorAccent)}>
              {participant.name}
            </span>
          )}
        </div>
        <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${((qi + 1) / total) * 100}%`, background: "linear-gradient(90deg, #d4af5f, #e8c97a)" }} />
        </div>
      </div>

      {/* Timer ring */}
      {timerActive && remaining !== null && !hasVoted && (
        <div className="shrink-0 flex justify-center pt-1">
          <TimerRing remaining={remaining} total={timerDuration} />
        </div>
      )}

      {/* Question */}
      <div className="shrink-0 card-gold px-5 py-4 text-center space-y-2">
        <p className="ornament text-[10px]">Wer von beiden...</p>
        <h2 className="font-serif text-xl sm:text-2xl text-white italic leading-snug">{question}</h2>
      </div>

      {/* Buttons / Status */}
      {!votingClosed ? (
        <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
          <button onClick={() => vote("Patrick")}
            className="vote-btn-patrick card flex flex-col items-center justify-center gap-3
                       active:scale-95 transition-all duration-150 border-sky-500/20
                       active:border-sky-400/60 focus:outline-none select-none">
            <span className="text-5xl sm:text-6xl">👔</span>
            <span className="font-bold text-xl sm:text-2xl text-white">Patrick</span>
          </button>
          <button onClick={() => vote("Theresa")}
            className="vote-btn-theresa card flex flex-col items-center justify-center gap-3
                       active:scale-95 transition-all duration-150 border-pink-500/20
                       active:border-pink-400/60 focus:outline-none select-none">
            <span className="text-5xl sm:text-6xl">👗</span>
            <span className="font-bold text-xl sm:text-2xl text-white">Theresa</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="card-gold p-8 text-center space-y-3 animate-slide-up w-full">
            {hasVoted ? (
              <>
                <div className="text-6xl">✓</div>
                <p className="text-white font-semibold text-xl">Stimme abgegeben!</p>
                <p className="text-surface-3">
                  Du hast für <span className="font-bold text-white">{myChoice}</span> gestimmt.
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl">⏱</div>
                <p className="text-white font-semibold text-xl">Zeit abgelaufen!</p>
                <p className="text-surface-3">Die Abstimmung ist geschlossen.</p>
              </>
            )}
            <p className="text-gold/40 text-xs tracking-wider">Warten auf Auswertung...</p>
          </div>
        </div>
      )}
    </div>
  );
}
