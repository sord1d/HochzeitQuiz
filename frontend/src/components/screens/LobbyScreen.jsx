import React from "react";
import { useSocket } from "../../context/SocketContext";
import { badgeStyle } from "../Badge";

export default function LobbyScreen() {
  const { gameState, participant } = useSocket();
  const count = gameState?.participantCount ?? 0;

  return (
    <div className="screen-scroll items-center justify-center animate-fade-in">
      <div className="w-full max-w-sm space-y-8 text-center">

        <div className="space-y-3">
          <p className="ornament">Schuhspiel</p>
          <h1 className="font-serif text-5xl italic text-white leading-tight">
            Patrick<br />&amp; Theresa
          </h1>
        </div>

        <div className="card-gold p-10 space-y-6">
          <div className="flex justify-center">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border border-gold/10 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="absolute inset-3 rounded-full border border-gold/15 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.4s" }} />
              <div className="absolute inset-6 rounded-full border border-gold/20 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.8s" }} />
              <div className="absolute inset-0 flex items-center justify-center text-4xl">💍</div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-white font-semibold text-xl">Warten auf den Start...</p>
            <p className="text-surface-3 text-sm">Der Moderator startet das Spiel gleich.</p>
          </div>

          {participant && (
            <div className="flex justify-center">
              <span
                className="px-5 py-2 rounded-full text-sm font-bold text-white shadow-lg"
                style={badgeStyle(participant.colorBase, participant.colorAccent)}
              >
                {participant.name}
              </span>
            </div>
          )}
        </div>

        <p className="text-gold/40 text-xs tracking-widest">
          {count} {count === 1 ? "Gast" : "Gäste"} verbunden
        </p>
      </div>
    </div>
  );
}
