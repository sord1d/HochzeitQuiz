import { useState, useEffect } from "react";

// Returns seconds remaining (integer), or null if no timer active.
export function useCountdown(timerEndsAt) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!timerEndsAt) { setRemaining(null); return; }

    const tick = () => {
      const r = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
      setRemaining(r);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [timerEndsAt]);

  return remaining;
}
