import React from "react";
import { useSocket } from "../../context/SocketContext";

export default function LobbyScreen() {
  const { gameState, participant } = useSocket();
  const count = gameState?.participantCount ?? 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="font-serif text-3xl italic text-white">Patrick & Theresa</h1>
          <p className="text-surface-3 text-sm tracking-widest uppercase">Schuhspiel</p>
        </div>

        {/* Animated waiting indicator */}
        <div className="card p-8 space-y-6">
          <div className="flex justify-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-white/20 animate-ping [animation-delay:300ms]" />
              <div className="absolute inset-4 rounded-full border-2 border-white/30 animate-ping [animation-delay:600ms]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">💍</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-white font-semibold text-lg">Warten auf den Start...</p>
            <p className="text-surface-3 text-sm">Der Moderator startet das Spiel gleich.</p>
          </div>

          {participant && (
            <div className="flex justify-center">
              <span
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-surface"
                style={{ backgroundColor: participant.color }}
              >
                {participant.name}
              </span>
            </div>
          )}
        </div>

        <p className="text-surface-3 text-xs">
          {count} {count === 1 ? "Gast" : "Gäste"} verbunden
        </p>
      </div>
    </div>
  );
}
