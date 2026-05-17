import React from "react";
import { useSocket } from "../../context/SocketContext";
import { Badge, badgeStyle } from "../Badge";

function VoteColumn({ name, emoji, votes, total, accentColor }) {
  const pct = total > 0 ? Math.round((votes.length / total) * 100) : 0;

  return (
    <div className="card flex-1 flex flex-col gap-3 p-4">
      <div className="text-center">
        <div className="text-3xl mb-1">{emoji}</div>
        <p className="font-bold text-white text-base">{name}</p>
        <p
          className="text-5xl font-serif font-bold leading-none my-2"
          style={{ color: accentColor, textShadow: `0 0 30px ${accentColor}60` }}
        >
          {pct}%
        </p>
        <p className="text-surface-3 text-xs">{votes.length} Stimme{votes.length !== 1 ? "n" : ""}</p>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})` }}
        />
      </div>
      <div className="flex flex-wrap justify-center min-h-[50px]">
        {votes.map((v) => (
          <Badge key={v.id} name={v.name} colorBase={v.colorBase} colorAccent={v.colorAccent} size="sm" />
        ))}
        {votes.length === 0 && <p className="text-surface-3 text-xs self-center">Keine Stimmen</p>}
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
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-surface-3">Auswertung lädt...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col p-5 animate-fade-in">
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs mb-2">
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
      </div>

      <div className="card-gold p-5 text-center mb-4">
        <p className="ornament mb-2">Ergebnis</p>
        <h2 className="font-serif text-xl text-white italic">{ev.question}</h2>
      </div>

      <div className="flex gap-3 flex-1">
        <VoteColumn name="Patrick" emoji="👔" votes={ev.patrick} total={ev.voted} accentColor="#38bdf8" />
        <VoteColumn name="Theresa" emoji="👗" votes={ev.theresa} total={ev.voted} accentColor="#f472b6" />
      </div>

      <p className="text-center text-gold/30 text-xs mt-4 tracking-widest">
        Warten auf die nächste Frage...
      </p>
    </div>
  );
}
