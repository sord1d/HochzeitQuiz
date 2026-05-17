import React from "react";

export default function FinishedScreen() {
  return (
    <div className="screen items-center justify-center text-center animate-fade-in">
      <div className="space-y-6 max-w-sm">
        <div className="text-6xl animate-pulse2">💍</div>
        <div className="space-y-3">
          <p className="ornament">Das Spiel ist vorbei</p>
          <h1 className="font-serif text-4xl italic text-white leading-tight">
            Patrick &amp; Theresa
          </h1>
          <p className="text-gold/60 text-sm leading-relaxed">
            Vielen Dank fürs Mitspielen.<br />
            Auf viele gemeinsame Jahre! 🥂
          </p>
        </div>
      </div>
    </div>
  );
}
