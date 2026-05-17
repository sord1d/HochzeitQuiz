import React from "react";
import { useSocket } from "../../context/SocketContext";

function NameBadge({ name, color }) {
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-surface m-1 animate-fade-in"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  );
}

function VoteColumn({ name, emoji, votes, total, accentColor }) {
  const pct = total > 0 ? Math.round((votes.length / total) * 100) : 0;

  return (
    <div className="card p-4 flex-1 flex flex-col gap-3">
      <div className="text-center">
        <div className="text-3xl mb-1">{emoji}</div>
        <p className="font-bold text-white text-lg">{name}</p>
        <p className="text-4xl font-serif font-bold" style={{ color: accentColor }}>
          {pct}%
        </p>
        <p className="text-surface-3 text-xs">{votes.length} Stimme{votes.length !== 1 ? "n" : ""}</p>
      </div>

      {/* Bar */}
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: accentColor }}
        />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap justify-center min-h-[60px]">
        {votes.map((v) => (
          <NameBadge key={v.id} name={v.name} color={v.color} />
        ))}
        {votes.length === 0 && (
          <p className="text-surface-3 text-xs self-center">Keine Stimmen</p>
        )}
      </div>
    </div>
  );
}

export default function EvaluationScreen() {
  const { gameState, participant } = useSocket();
  const ev = gameState?.evaluation;
  const qi = gameState?.currentQuestionIndex ?? 0;
  const total = gameState?.totalQuestions ?? 16;

  if (!ev) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-surface-3">Auswertung lädt...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-5 animate-fade-in">
      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-surface-3 mb-2">
          <span>Frage {qi + 1} von {total}</span>
          {participant && (
            <span
              className="px-2 py-0.5 rounded-full font-medium text-surface text-xs"
              style={{ backgroundColor: participant.color }}
            >
              {participant.name}
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="card p-4 text-center mb-5">
        <p className="text-surface-3 text-xs uppercase tracking-widest mb-1">Ergebnis</p>
        <h2 className="font-serif text-xl text-white italic">{ev.question}</h2>
      </div>

      {/* Results */}
      <div className="flex gap-3 flex-1">
        <VoteColumn
          name="Patrick"
          emoji="👔"
          votes={ev.patrick}
          total={ev.voted}
          accentColor="#38bdf8"
        />
        <VoteColumn
          name="Theresa"
          emoji="👗"
          votes={ev.theresa}
          total={ev.voted}
          accentColor="#f472b6"
        />
      </div>

      <p className="text-center text-surface-3 text-xs mt-4">
        Warten auf die nächste Frage...
      </p>
    </div>
  );
}
