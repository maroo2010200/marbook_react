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
   * A calming, warm ember chime (gentle harmonic glow: G4 + B4 major third with soft acoustic attack and silky decay).
   */
  playRoast() {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Tone 1: Warm fundamental G4 (392.00 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(392.0, now);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.45);

      // Tone 2: Harmonious sweet third B4 (493.88 Hz) entering at +20ms
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(493.88, now + 0.02);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.0001, now + 0.02);
      gain2.gain.linearRampToValueAtTime(0.09, now + 0.045);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.02);
      osc2.stop(now + 0.5);

      // Subtle warm undertone: G3 (196.00 Hz) for cozy acoustic depth
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(196.0, now);

      gain3.gain.setValueAtTime(0.0001, now);
      gain3.gain.linearRampToValueAtTime(0.04, now + 0.02);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);

      osc3.start(now);
      osc3.stop(now + 0.35);
    } catch {
      // Audio playback silently ignored if blocked by browser policy
    }
  },

  /**
   * 💬 Comment Sound:
   * A calming, tranquil zen water droplet / mellow tongue drum tap (gentle E4 with subtle acoustic roundness and soft decay).
   */
  playComment() {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Soft natural water droplet: micro-pitch settling from 360 Hz to E4 (329.63 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(360, now);
      osc1.frequency.exponentialRampToValueAtTime(329.63, now + 0.035);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.38);

      // Gentle acoustic bell overtone: B4 (493.88 Hz) at quiet volume
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(493.88, now + 0.015);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.0001, now + 0.015);
      gain2.gain.linearRampToValueAtTime(0.05, now + 0.035);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.015);
      osc2.stop(now + 0.42);
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
   * A calming, tranquil wind-chime / soft meditation bell (peaceful C5 + G5 harmonic pair with soft attack and serene decay).
   */
  playNotification() {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: C5 (523.25 Hz) - gentle singing bell
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.1, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.7);

      // Note 2: Harmonious fifth G5 (783.99 Hz) entering softly at +60ms
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(783.99, now + 0.06);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.0001, now + 0.06);
      gain2.gain.linearRampToValueAtTime(0.08, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.06);
      osc2.stop(now + 0.8);

      // Warm body resonance: G4 (392.00 Hz) for soft acoustic fullness
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(392.0, now + 0.02);

      gain3.gain.setValueAtTime(0.0001, now);
      gain3.gain.setValueAtTime(0.0001, now + 0.02);
      gain3.gain.linearRampToValueAtTime(0.03, now + 0.05);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);

      osc3.start(now + 0.02);
      osc3.stop(now + 0.6);
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

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.07);

      // Pop 2 (higher, sweet bubble at +65ms)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(740, now + 0.065);
      osc2.frequency.exponentialRampToValueAtTime(1020, now + 0.115);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.0001, now + 0.065);
      gain2.gain.linearRampToValueAtTime(0.12, now + 0.075);
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

