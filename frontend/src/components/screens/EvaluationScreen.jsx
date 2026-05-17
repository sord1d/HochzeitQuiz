import React from "react";
import { useSocket } from "../../context/SocketContext";
import { Badge, badgeStyle } from "../Badge";

function VoteColumn({ name, emoji, votes, total, accentColor }) {
  const pct = total > 0 ? Math.round((votes.length / total) * 100) : 0;

  return (
    <div className="card flex-1 flex flex-col min-h-0 p-3 sm:p-4">
      {/* Stats — compact, never scrolls away */}
      <div className="shrink-0 text-center pb-2">
        <div className="text-2xl sm:text-3xl">{emoji}</div>
        <p className="font-bold text-white text-sm sm:text-base">{name}</p>
        <p
          className="text-4xl sm:text-5xl font-serif font-bold leading-none my-1"
          style={{ color: accentColor, textShadow: `0 0 25px ${accentColor}50` }}
        >
          {pct}%
        </p>
        <p className="text-surface-3 text-xs">{votes.length} Stimme{votes.length !== 1 ? "n" : ""}</p>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-2">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accentColor}70, ${accentColor})` }}
          />
        </div>
      </div>

      {/* Badges — scrollable if many names */}
      <div className="flex-1 overflow-y-auto min-h-0 mt-2 -mx-1">
        <div className="flex flex-wrap justify-center content-start">
          {votes.map((v) => (
            <Badge key={v.id} name={v.name} colorBase={v.colorBase} colorAccent={v.colorAccent} size="sm" />
          ))}
          {votes.length === 0 && (
            <p className="text-surface-3 text-xs w-full text-center pt-3">Keine Stimmen</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EvaluationScreen() {
  const { gameState, participant } = useSocket();
  const ev = gameState?.evaluation;
  const qi = gameState?.currentQuestionIndex ?? 0;
  const total = gameState?.totalQuestions ?? 16;

  if (!ev) return (
    <div className="screen items-center justify-center">
      <p className="text-surface-3">Auswertung lädt...</p>
    </div>
  );

  return (
    <div className="screen animate-fade-in gap-3">

      {/* Header */}
      <div className="shrink-0 flex justify-between items-center text-xs">
        <span className="text-gold/60 tracking-widest">Frage {qi + 1} / {total}</span>
        {participant && (
          <span
            className="px-3 py-1 rounded-full font-bold text-white text-xs"
            style={badgeStyle(participant.colorBase, participant.colorAccent)}
          >
            {participant.name}
          </span>
        )}
      </div>

      {/* Question */}
      <div className="shrink-0 card-gold px-5 py-4 text-center space-y-1">
        <p className="ornament text-[10px]">Ergebnis</p>
        <h2 className="font-serif text-lg sm:text-xl text-white italic leading-snug">{ev.question}</h2>
      </div>

      {/* Results — fill remaining space, each column scrolls independently */}
      <div className="flex-1 flex gap-3 min-h-0">
        <VoteColumn name="Patrick" emoji="👔" votes={ev.patrick} total={ev.voted} accentColor="#38bdf8" />
        <VoteColumn name="Theresa" emoji="👗" votes={ev.theresa} total={ev.voted} accentColor="#f472b6" />
      </div>

      <p className="shrink-0 text-center text-gold/30 text-xs tracking-widest">
        Warten auf die nächste Frage...
      </p>
    </div>
  );
}
