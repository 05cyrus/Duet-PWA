/**
 * Background music synthesised with WebAudio — no audio assets needed,
 * so the game stays fully offline-playable.
 */

const SCALE = [261.63, 311.13, 349.23, 392.0, 466.16, 523.25, 622.25, 698.46]; // C minor pentatonic-ish

export class ChipMusic {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private master: GainNode | null = null;

  get playing(): boolean {
    return this.timer !== null;
  }

  start() {
    if (this.timer) return;
    this.ctx ??= new AudioContext();
    this.ctx.resume();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.16;
    this.master.connect(this.ctx.destination);

    const stepDur = 60 / 132 / 2; // 132bpm, eighth notes
    this.timer = setInterval(() => this.tick(stepDur), stepDur * 1000);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.master?.disconnect();
    this.master = null;
  }

  private tick(stepDur: number) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const bar = Math.floor(this.step / 8) % 4;
    const idx = [0, 2, 4, 2, 5, 4, 2, bar][this.step % 8] % SCALE.length;

    // Lead arp
    this.note(SCALE[idx] * (bar === 3 ? 2 : 1), t, stepDur * 0.9, "square", 0.5);
    // Bass every 4 steps
    if (this.step % 4 === 0) this.note(SCALE[bar % 4] / 2, t, stepDur * 3.5, "triangle", 0.8);
    // Hat
    this.noise(t, 0.03);

    this.step++;
  }

  private note(freq: number, t: number, dur: number, type: OscillatorType, vol: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur);
  }

  private noise(t: number, dur: number) {
    if (!this.ctx || !this.master) return;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.buffer = buffer;
    src.connect(gain).connect(this.master);
    src.start(t);
  }

  /** One-shot SFX (jump, coin, death, win). */
  sfx(kind: "jump" | "coin" | "death" | "win" | "checkpoint") {
    this.ctx ??= new AudioContext();
    const t = this.ctx.currentTime;
    const master = this.ctx.createGain();
    master.gain.value = 0.25;
    master.connect(this.ctx.destination);
    const blip = (f0: number, f1: number, dur: number, type: OscillatorType = "square") => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(master);
      osc.start(t); osc.stop(t + dur);
    };
    switch (kind) {
      case "jump": blip(300, 620, 0.12); break;
      case "coin": blip(900, 1500, 0.09, "sine"); blip(1200, 1800, 0.14, "sine"); break;
      case "death": blip(400, 60, 0.4, "sawtooth"); break;
      case "checkpoint": blip(500, 900, 0.15, "triangle"); break;
      case "win": blip(523, 1046, 0.5, "triangle"); blip(659, 1318, 0.5, "triangle"); break;
    }
  }
}
