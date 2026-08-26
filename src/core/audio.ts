import { loadMuted, saveMuted } from './storage';

type Ctor = typeof AudioContext;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = loadMuted();

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    saveMuted(muted);
    if (!muted) this.unlock();
  }

  unlock(): void {
    if (this.muted || this.ctx) return;
    try {
      const AC: Ctor | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      void this.ctx.resume().catch(() => {});
    } catch {
      this.ctx = null;
    }
  }

  private tone(
    freq: number,
    dur: number,
    delay = 0,
    type: OscillatorType = 'sine',
    vol = 0.08
  ): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {}
  }

  move(): void {
    this.tone(220, 0.05, 0, 'triangle', 0.03);
  }

  merge(gained: number): void {
    const step = Math.min(Math.log2(Math.max(gained, 2)), 11);
    const freq = 320 + step * 55;
    this.tone(freq, 0.09, 0, 'sine', 0.09);
    this.tone(freq * 1.5, 0.12, 0.06, 'sine', 0.07);
  }

  combo(count: number): void {
    const freq = 300 * Math.pow(1.1, Math.min(count, 8));
    this.tone(freq, 0.07, 0.02, 'square', 0.04);
    this.tone(freq * 1.25, 0.1, 0.08, 'square', 0.035);
  }

  best(): void {
    const notes = [659, 880, 1175];
    notes.forEach((n, i) => this.tone(n, 0.15, i * 0.08, 'triangle', 0.07));
  }

  win(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => this.tone(n, 0.18, i * 0.09, 'triangle', 0.07));
  }

  lose(): void {
    const notes = [330, 247, 196];
    notes.forEach((n, i) => this.tone(n, 0.16, i * 0.14, 'sine', 0.06));
  }
}

export const sound = new SoundEngine();
