"use client";

import type { PowerUpType } from "./types";

// Major pentatonic frequencies spanning 3 octaves (C4..C6+)
const PENTATONIC_HZ = [
  261.63, 293.66, 329.63, 392.0, 440.0,
  523.25, 587.33, 659.25, 783.99, 880.0,
  1046.5, 1174.66, 1318.51, 1567.98, 1760.0,
];

class Sound2048 {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  public enabled = true;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const length = Math.floor(ctx.sampleRate * 0.055);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 0x2468ace1;
    for (let i = 0; i < length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const white = (seed / 0xffffffff) * 2 - 1;
      const env = Math.exp(-i / (length * 0.3));
      data[i] = white * env;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  playSlide() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = this.getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(680, now);
      filter.frequency.exponentialRampToValueAtTime(1180, now + 0.045);
      filter.Q.setValueAtTime(1.8, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.055);
    } catch {
      // Ignore audio policy blocks
    }
  }

  playMerge(rank: number, multiCount = 1) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const clampedIdx = Math.max(
        0,
        Math.min(PENTATONIC_HZ.length - 1, rank)
      );
      const baseFreq = PENTATONIC_HZ[clampedIdx];

      // Warm bell fundamental
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = rank >= 8 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(baseFreq * 0.98, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.02);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);

      // Harmonic shimmer on multi-merges or high-tier tiles
      if (multiCount > 1 || rank >= 6) {
        const harmonics = multiCount > 2 ? [1.25, 1.5] : [1.5];
        harmonics.forEach((ratio, idx) => {
          const hOsc = ctx.createOscillator();
          const hGain = ctx.createGain();
          const t = now + 0.025 + idx * 0.03;
          hOsc.type = "sine";
          hOsc.frequency.setValueAtTime(baseFreq * ratio, t);
          hGain.gain.setValueAtTime(0.075, t);
          hGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          hOsc.connect(hGain);
          hGain.connect(ctx.destination);
          hOsc.start(t);
          hOsc.stop(t + 0.23);
        });
      }
    } catch {
      // Ignore
    }
  }

  playBlocked() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(125, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.07);
      gain.gain.setValueAtTime(0.085, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  playUndo() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [523.25, 392.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.045;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.13);
      });
    } catch {
      // Ignore
    }
  }

  playPowerUp(type: PowerUpType) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      if (type === "swap") {
        [440, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.055;
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.11, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.17);
        });
      } else {
        // Smash punch + crystalline shatter
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.12);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);

        const src = ctx.createBufferSource();
        src.buffer = this.getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(1600, now);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.16, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
        src.connect(filter);
        filter.connect(nGain);
        nGain.connect(ctx.destination);
        src.start(now);
        src.stop(now + 0.06);
      }
    } catch {
      // Ignore
    }
  }

  playMilestone() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.055;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.26);
      });
    } catch {
      // Ignore
    }
  }

  playVictory() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.085;
        osc.type = idx === 3 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.44);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.46);
      });
    } catch {
      // Ignore
    }
  }

  playGameOver() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [329.63, 293.66, 246.94].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.11;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.11, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.32);
      });
    } catch {
      // Ignore
    }
  }
}

export const sound2048 = new Sound2048();
