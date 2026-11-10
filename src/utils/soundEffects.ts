/**
 * Cozy Web Audio Sound Effects for Marshmallow Social.
 * Pure Web Audio API — 0 KB external audio files, 0ms latency.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Checks whether campfire sound effects are enabled.
 * Defaults to true.
 */
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("marshmallow_sound_enabled") !== "false";
}

/**
 * Toggles sound effects on/off.
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("marshmallow_sound_enabled", enabled ? "true" : "false");
}

export const soundEffects = {
  /**
   * 🔥 Roast Sound:
   * A satisfying warm campfire pop accompanied by a subtle ember sizzle.
   */
  playRoast() {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Warm bubble pop (rising tone)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);

      // 2. Ember Sizzle (filtered micro-noise burst)
      const bufferSize = ctx.sampleRate * 0.06; // 60ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(3200, now);
      filter.Q.setValueAtTime(3.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.06);
    } catch {
      // Audio playback silently ignored if blocked by browser policy
    }
  },

  /**
   * 💬 Comment Sound:
   * A soft, playful marshmallow "squish / plop".
   */
  playComment() {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Soft rubbery downward pitch glide (plop)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.14);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);

      // Secondary soft bass undertone for squishy feel
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();

      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(220, now);
      subOsc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

      subGain.gain.setValueAtTime(0.12, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + 0.12);
    } catch {
      // Ignore audio failure
    }
  },

  /**
   * 🤝 Follow Sound:
   * A calming, tranquil ambient chime (peaceful D4 + A4 singing-bowl fifth with silky smooth decay).
   */
  playFollow() {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Base warm tone: D4 (293.66 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(293.66, now);

      // Soft silky attack (no sharp clicks) & peaceful long decay
      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.14, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.65);

      // Harmonious fifth tone: A4 (440 Hz) - entering 40ms later
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(440.0, now + 0.04);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.0001, now + 0.04);
      gain2.gain.linearRampToValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.04);
      osc2.stop(now + 0.75);

      // Gentle warm shimmer overtone: D5 (587.33 Hz) at very low volume
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(587.33, now + 0.07);

      gain3.gain.setValueAtTime(0.0001, now);
      gain3.gain.setValueAtTime(0.0001, now + 0.07);
      gain3.gain.linearRampToValueAtTime(0.05, now + 0.12);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);

      osc3.start(now + 0.07);
      osc3.stop(now + 0.8);
    } catch {
      // Ignore audio failure
    }
  },

  /**
   * 🗑️ Delete Sound:
   * A gentle, soft "ember poof / ash dissolve" whoosh when a post or comment is removed.
   */
  playDelete() {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Soft descending tone (dissolve)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.16);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);

      // 2. Soft ash/smoke whisper puff (lowpass filtered noise)
      const bufferSize = ctx.sampleRate * 0.12; // 120ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.12);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.09, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.12);
    } catch {
      // Ignore audio failure
    }
  },

  /**
   * 🔔 Notification Sound:
   * A warm, sweet campfire spark ping (two-note chime: A5 -> C#6).
   */
  playNotification() {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: A5 (880 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.15, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.2);

      // Note 2: C#6 (1108.73 Hz) at +60ms
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1108.73, now + 0.06);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.0001, now + 0.06);
      gain2.gain.linearRampToValueAtTime(0.16, now + 0.075);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.06);
      osc2.stop(now + 0.28);
    } catch {
      // Ignore audio failure
    }
  },

  /**
   * 💬 Incoming Chat Message:
   * A soft, playful marshmallow double-pop / waterdrop (bloop-pop!).
   */
  playChatMessage() {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Pop 1 (low bubble)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(560, now);
      osc1.frequency.exponentialRampToValueAtTime(780, now + 0.045);

      gain1.gain.setValueAtTime(0.14, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.065);

      // Pop 2 (higher, sweet bubble at +65ms)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(740, now + 0.065);
      osc2.frequency.exponentialRampToValueAtTime(1020, now + 0.115);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.16, now + 0.065);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.145);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.065);
      osc2.stop(now + 0.145);
    } catch {
      // Ignore audio failure
    }
  },

  /**
   * ✉️ Outgoing Chat Sent:
   * A light, airy whoosh confirming your message has been sent.
   */
  playChatSent() {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore audio failure
    }
  },
};

