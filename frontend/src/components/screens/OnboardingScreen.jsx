import React, { useState } from "react";
import { useSocket } from "../../context/SocketContext";

const PRESET_COLORS = [
  "#f43f5e", // rose
  "#fb923c", // orange
  "#facc15", // yellow
  "#4ade80", // green
  "#34d399", // emerald
  "#38bdf8", // sky
  "#818cf8", // indigo
  "#c084fc", // purple
  "#f472b6", // pink
  "#a78bfa", // violet
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
        <div className="text-center space-y-2">
          <p className="text-surface-3 text-sm tracking-widest uppercase">Herzlich Willkommen</p>
          <h1 className="font-serif text-4xl text-white italic">Patrick & Theresa</h1>
          <p className="text-surface-3 text-sm mt-1">Das Schuhspiel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-surface-3 font-medium">Dein Name</label>
            <input
              className="input-field"
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
            <label className="text-sm text-surface-3 font-medium">Deine Farbe</label>
            <div className="grid grid-cols-5 gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-full aspect-square rounded-xl transition-all duration-150 active:scale-90"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : "none",
                    transform: color === c ? "scale(1.1)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview badge */}
          <div className="flex justify-center">
            <span
              className="px-4 py-1.5 rounded-full text-sm font-semibold text-surface"
              style={{ backgroundColor: color }}
            >
              {name || "Vorschau"}
            </span>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !connected}
            className="btn-primary w-full text-surface"
            style={{ backgroundColor: color }}
          >
            {connected ? "Teilnehmen" : "Verbinde..."}
          </button>
        </form>

        <p className="text-center text-surface-3 text-xs">
          {connected ? "✓ Verbunden" : "Verbinde mit Server..."}
        </p>
      </div>
    </div>
  );
}
