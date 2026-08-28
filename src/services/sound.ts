function beep(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.04) {
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  try {
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => void ctx.close();
  } catch {
    /* autoplay or audio restrictions */
  }
}

export function playQuestSound() {
  beep(660, 0.12, "triangle", 0.03);
}

export function playLevelSound() {
  beep(520, 0.1, "sine", 0.03);
  setTimeout(() => beep(780, 0.16, "sine", 0.035), 90);
}
