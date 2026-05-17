import React from "react";

export default function FinishedScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="space-y-6">
        <div className="text-6xl">🎉</div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl italic text-white">Das Spiel ist vorbei!</h1>
          <p className="text-surface-3 text-sm">
            Vielen Dank fürs Mitspielen.<br />
            Herzlichen Glückwunsch an Patrick & Theresa!
          </p>
        </div>
        <div className="text-4xl">💍</div>
      </div>
    </div>
  );
}
