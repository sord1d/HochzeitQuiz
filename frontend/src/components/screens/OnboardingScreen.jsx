import React, { useState } from "react";
import { useSocket } from "../../context/SocketContext";

const PRESET_COLORS = [
  "#f43f5e", "#fb923c", "#facc15", "#4ade80", "#34d399",
  "#38bdf8", "#818cf8", "#c084fc", "#f472b6", "#a78bfa",
];

export default function OnboardingScreen() {
  const { join, connected } = useSocket();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    join(name.trim(), color);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <p className="ornament">Herzlich Willkommen</p>
          <h1 className="font-serif text-5xl text-white italic leading-tight">
            Patrick<br />&amp; Theresa
          </h1>
          <p className="text-gold text-sm tracking-widest uppercase font-light">Das Schuhspiel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card-gold p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-gold/70 font-medium tracking-widest uppercase">Dein Name</label>
            <input
              className="input-field text-lg"
              type="text"
              maxLength={30}
              placeholder="Name eingeben..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs text-gold/70 font-medium tracking-widest uppercase">Deine Farbe</label>
            <div className="grid grid-cols-5 gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-full aspect-square rounded-xl transition-all duration-200 active:scale-90"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c
                      ? `0 0 0 2px #0f172a, 0 0 0 4px ${c}, 0 0 12px ${c}60`
                      : "none",
                    transform: color === c ? "scale(1.12)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview badge */}
          <div className="flex justify-center py-1">
            <span
              className="px-5 py-2 rounded-full text-sm font-bold text-surface shadow-lg transition-all duration-300"
              style={{
                backgroundColor: color,
                boxShadow: `0 4px 15px ${color}60`,
              }}
            >
              {name || "Vorschau"}
            </span>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !connected}
            className="btn-primary w-full text-surface font-bold text-base"
            style={{
              backgroundColor: color,
              boxShadow: name.trim() ? `0 4px 20px ${color}50` : "none",
            }}
          >
            {connected ? "Teilnehmen" : "Verbinde..."}
          </button>
        </form>

        <p className="text-center text-surface-3 text-xs">
          {connected
            ? <span className="text-gold/60">✦ Verbunden</span>
            : "Verbinde mit Server..."}
        </p>
      </div>
    </div>
  );
}
