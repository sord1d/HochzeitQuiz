import { useEffect, useRef } from "react";

// Lazy AudioContext — browsers block audio before user interaction
function getCtx(ref) {
  if (!ref.current) {
    try { ref.current = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (ref.current.state === "suspended") ref.current.resume();
  return ref.current;
}

function beep(ctx, freq, duration, volume = 0.25, delay = 0) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = freq;
  const t = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

function playTick(ctx) {
  beep(ctx, 1047, 0.08, 0.2); // C6 — sharp click
}

function playStop(ctx) {
  // Short triumphant descend: C6 → G5 → C5
  beep(ctx, 1047, 0.15, 0.3, 0.00);
  beep(ctx, 784,  0.15, 0.3, 0.16);
  beep(ctx, 523,  0.30, 0.3, 0.32);
}

// Plays tick sounds during last `warnAt` seconds, stop sound at 0.
export function useTimerSounds(remaining, warnAt = 5) {
  const ctxRef  = useRef(null);
  const prevRef = useRef(null);

  useEffect(() => {
    if (remaining === null) { prevRef.current = null; return; }
    const prev = prevRef.current;
    prevRef.current = remaining;

    // Only fire when the value actually decrements
    if (prev === null || remaining >= prev) return;

    const ctx = getCtx(ctxRef);
    if (!ctx) return;

    if (remaining === 0) {
      playStop(ctx);
    } else if (remaining <= warnAt) {
      playTick(ctx);
    }
  }, [remaining, warnAt]);
}
