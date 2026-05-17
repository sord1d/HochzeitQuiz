import { useEffect, useRef } from "react";
import { playTick, playSoftTick, playStop } from "../audio";

export function useTimerSounds(remaining, warnAt = 5) {
  const prevRef = useRef(null);

  useEffect(() => {
    if (remaining === null) { prevRef.current = null; return; }
    const prev = prevRef.current;
    prevRef.current = remaining;

    if (prev === null || remaining >= prev) return;

    if (remaining === 0)          playStop();
    else if (remaining <= warnAt) playTick();     // laut, letzte 5 Sek
    else                          playSoftTick(); // leise, ganzer Timer
  }, [remaining, warnAt]);
}
