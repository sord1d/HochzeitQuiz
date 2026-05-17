// Singleton AudioContext — must be unlocked inside a user gesture (iOS requirement).
let _ctx = null;

export function getAudioContext() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _ctx;
}

export function unlockAudio() {
  const ctx = getAudioContext();
  // Resume suspended context (iOS suspends it until a gesture)
  if (ctx.state === "suspended") ctx.resume();
  // Play a silent 1-sample buffer — forces iOS to fully unlock
  const buf = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
}

function beep(freq, duration, volume = 0.25, delay = 0) {
  const ctx = getAudioContext();
  if (ctx.state !== "running") return;
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

export function playTick() {
  beep(1047, 0.08, 0.22); // C6
}

export function playStop() {
  beep(1047, 0.14, 0.30, 0.00); // C6
  beep(784,  0.14, 0.30, 0.16); // G5
  beep(523,  0.28, 0.30, 0.32); // C5
}
