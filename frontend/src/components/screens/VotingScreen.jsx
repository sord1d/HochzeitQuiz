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
      <div className="mb-6 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gold/60 tracking-widest">Frage {qi + 1} / {total}</span>
          {participant && (
            <span
              className="px-3 py-1 rounded-full font-bold text-surface text-xs shadow-md"
              style={{
                backgroundColor: participant.color,
                boxShadow: `0 2px 10px ${participant.color}50`,
              }}
            >
              {participant.name}
            </span>
          )}
        </div>
        <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${((qi + 1) / total) * 100}%`,
              background: `linear-gradient(90deg, #d4af5f, #e8c97a)`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <div className="card-gold p-7 text-center space-y-3">
          <p className="ornament">Wer von beiden...</p>
          <h2 className="font-serif text-2xl md:text-3xl text-white italic leading-snug">
            {question}
          </h2>
        </div>

        {/* Vote buttons */}
        {!hasVoted ? (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => vote("Patrick")}
              className="vote-btn-patrick card flex flex-col items-center gap-3 p-6
                         active:scale-95 transition-all duration-200 border-sky-500/20
                         hover:border-sky-400/40 focus:outline-none"
            >
              <span className="text-4xl">👔</span>
              <span className="font-bold text-xl text-white">Patrick</span>
            </button>
            <button
              onClick={() => vote("Theresa")}
              className="vote-btn-theresa card flex flex-col items-center gap-3 p-6
                         active:scale-95 transition-all duration-200 border-pink-500/20
                         hover:border-pink-400/40 focus:outline-none"
            >
              <span className="text-4xl">👗</span>
              <span className="font-bold text-xl text-white">Theresa</span>
            </button>
          </div>
        ) : (
          <div className="card-gold p-8 text-center space-y-3 animate-slide-up">
            <div className="text-5xl mb-2">✓</div>
            <p className="text-white font-semibold text-xl">Stimme abgegeben!</p>
            <p className="text-surface-3 text-sm">
              Du hast für{" "}
              <span className="font-bold text-white">{myChoice}</span> gestimmt.
            </p>
            <p className="text-gold/40 text-xs tracking-wider mt-2">Warten auf Auswertung...</p>
          </div>
        )}
      </div>
    </div>
  );
}
