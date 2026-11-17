class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainPeak = 0.12,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playTill() {
    this.tone(180, 95, 0.09, 'square', 0.08);
  }

  playPlant() {
    this.tone(360, 520, 0.08, 'sine', 0.09);
  }

  playWater() {
    this.tone(540, 290, 0.14, 'sine', 0.08);
    this.tone(660, 380, 0.11, 'triangle', 0.05, 0.05);
  }

  playHarvest() {
    this.tone(523, 659, 0.09, 'triangle', 0.11);
    this.tone(659, 880, 0.12, 'triangle', 0.11, 0.07);
  }

  playMine() {
    this.tone(420, 140, 0.08, 'square', 0.09);
    this.tone(920, 480, 0.06, 'triangle', 0.06, 0.02);
  }

  playChop() {
    this.tone(170, 75, 0.1, 'sawtooth', 0.09);
  }

  playSlash() {
    this.tone(340, 120, 0.11, 'sawtooth', 0.11);
  }

  playCrit() {
    this.tone(480, 160, 0.12, 'sawtooth', 0.13);
    this.tone(880, 1320, 0.16, 'triangle', 0.12, 0.05);
  }

  playMagic() {
    this.tone(440, 880, 0.18, 'sine', 0.1);
    this.tone(660, 1180, 0.22, 'triangle', 0.08, 0.06);
  }

  playHit() {
    this.tone(140, 55, 0.13, 'sawtooth', 0.13);
  }

  playDefend() {
    this.tone(310, 460, 0.12, 'triangle', 0.1);
  }

  playCoin() {
    this.tone(987, 987, 0.07, 'square', 0.08);
    this.tone(1318, 1318, 0.14, 'square', 0.08, 0.06);
  }

  playForge() {
    this.tone(680, 340, 0.08, 'square', 0.1);
    this.tone(1120, 720, 0.14, 'triangle', 0.09, 0.07);
  }

  playPortal() {
    this.tone(240, 620, 0.28, 'sine', 0.1);
    this.tone(360, 820, 0.3, 'triangle', 0.08, 0.08);
  }

  playLevelUp() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, idx) => this.tone(n, n, 0.14, 'triangle', 0.11, idx * 0.08));
  }

  playVictory() {
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((n, idx) => this.tone(n, n, 0.18, 'triangle', 0.12, idx * 0.09));
  }

  playDefeat() {
    const notes = [392, 349, 311, 261];
    notes.forEach((n, idx) => this.tone(n, n * 0.94, 0.22, 'sawtooth', 0.08, idx * 0.14));
  }
}

export const sound = new SoundEngine();
