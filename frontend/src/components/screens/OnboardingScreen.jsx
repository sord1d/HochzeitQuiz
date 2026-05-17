import React, { useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { unlockAudio } from "../../audio";

const COLORS = [
  { hex: "#f43f5e", label: "Rose"     },
  { hex: "#fb923c", label: "Orange"   },
  { hex: "#facc15", label: "Gelb"     },
  { hex: "#4ade80", label: "Grün"     },
  { hex: "#34d399", label: "Smaragd"  },
  { hex: "#38bdf8", label: "Himmel"   },
  { hex: "#818cf8", label: "Indigo"   },
  { hex: "#c084fc", label: "Lila"     },
  { hex: "#f472b6", label: "Pink"     },
  { hex: "#a78bfa", label: "Violett"  },
];

function badgeStyle(base, accent) {
  return {
    background: accent !== base
      ? `linear-gradient(135deg, ${base}, ${accent})`
      : base,
    boxShadow: `0 4px 16px ${accent}60`,
  };
}

function ColorRow({ label, selected, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-gold/70 font-medium tracking-widest uppercase">{label}</label>
      <div className="grid grid-cols-5 gap-2.5">
        {COLORS.map(({ hex }) => (
          <button
            key={hex}
            type="button"
            onClick={() => onChange(hex)}
            className="w-full aspect-square rounded-xl transition-all duration-200 active:scale-90"
            style={{
              backgroundColor: hex,
              boxShadow: selected === hex
                ? `0 0 0 2px #0f172a, 0 0 0 4px ${hex}, 0 0 12px ${hex}60`
                : "none",
              transform: selected === hex ? "scale(1.12)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function OnboardingScreen() {
  const { join, connected } = useSocket();
  const [name, setName] = useState("");
  const [colorBase, setColorBase]     = useState(COLORS[0].hex);
  const [colorAccent, setColorAccent] = useState(COLORS[8].hex);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    unlockAudio(); // iOS: AudioContext must be unlocked inside a user gesture
    join(name.trim(), colorBase, colorAccent);
  };

  return (
    <div className="screen-scroll items-center justify-center animate-fade-in">
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

          {/* Name */}
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

          {/* Base color */}
          <ColorRow label="Basisfarbe" selected={colorBase} onChange={setColorBase} />

          {/* Accent color */}
          <ColorRow label="Akzentfarbe" selected={colorAccent} onChange={setColorAccent} />

          {/* Preview */}
          <div className="flex flex-col items-center gap-2 py-1">
            <p className="text-xs text-gold/40 tracking-widest uppercase">Vorschau</p>
            <span
              className="px-6 py-2 rounded-full text-sm font-bold text-white shadow-lg transition-all duration-300"
              style={badgeStyle(colorBase, colorAccent)}
            >
              {name || "Dein Name"}
            </span>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !connected}
            className="btn-primary w-full text-white font-bold text-base"
            style={name.trim() ? badgeStyle(colorBase, colorAccent) : {}}
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
