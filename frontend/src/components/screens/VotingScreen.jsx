import React from "react";
import { useSocket } from "../../context/SocketContext";

export default function VotingScreen() {
  const { gameState, participant, myVotes, vote } = useSocket();
  const qi = gameState?.currentQuestionIndex ?? 0;
  const question = gameState?.question ?? "";
  const total = gameState?.totalQuestions ?? 16;
  const hasVoted = myVotes[qi] !== undefined;
  const myChoice = myVotes[qi];

  return (
    <div className="min-h-screen flex flex-col p-5 animate-fade-in">
      {/* Progress */}
      <div className="mb-6">
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
        <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((qi + 1) / total) * 100}%`,
              backgroundColor: participant?.color ?? "#818cf8",
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center space-y-8">
        <div className="card p-6 text-center">
          <p className="text-surface-3 text-xs uppercase tracking-widest mb-3">Wer von beiden...</p>
          <h2 className="font-serif text-2xl md:text-3xl text-white italic leading-snug">
            {question}
          </h2>
        </div>

        {/* Vote buttons */}
        {!hasVoted ? (
          <div className="grid grid-cols-2 gap-4">
            <VoteButton
              label="Patrick"
              emoji="👔"
              onClick={() => vote("Patrick")}
              baseColor="#38bdf8"
            />
            <VoteButton
              label="Theresa"
              emoji="👗"
              onClick={() => vote("Theresa")}
              baseColor="#f472b6"
            />
          </div>
        ) : (
          <div className="card p-6 text-center space-y-3 animate-slide-up">
            <div className="text-4xl">✓</div>
            <p className="text-white font-semibold text-lg">Stimme abgegeben!</p>
            <p className="text-surface-3 text-sm">
              Du hast für{" "}
              <span className="font-semibold text-white">{myChoice}</span> gestimmt.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function VoteButton({ label, emoji, onClick, baseColor }) {
  return (
    <button
      onClick={onClick}
      className="card p-6 flex flex-col items-center gap-3 active:scale-95 transition-all duration-150
                 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
      style={{ "--color": baseColor }}
    >
      <span className="text-4xl">{emoji}</span>
      <span className="font-bold text-lg text-white">{label}</span>
    </button>
  );
}
