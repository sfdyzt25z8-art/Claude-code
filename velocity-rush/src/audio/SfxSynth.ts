/**
 * One-shot and looping sound effects synthesised entirely from noise buffers
 * and oscillators — tire screech, drift loop, crashes, nitro, UI chimes,
 * coin pickups, countdown beeps. No audio files required.
 */
export class SfxSynth {
  private ctx: AudioContext;
  private destination: AudioNode;
  private noiseBuffer: AudioBuffer;

  private driftNode?: { source: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode };

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
    this.noiseBuffer = this.buildNoiseBuffer();
  }

  private buildNoiseBuffer(): AudioBuffer {
    const length = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private noiseSource(): AudioBufferSourceNode {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    return src;
  }

  playTireScreech(intensity = 0.6): void {
    const now = this.ctx.currentTime;
    const src = this.noiseSource();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 6;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18 * intensity, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.destination);
    src.start(now);
    src.stop(now + 0.55);
  }

  startDrift(): void {
    if (this.driftNode) return;
    const source = this.noiseSource();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 4;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.destination);
    source.start();
    this.driftNode = { source, gain, filter };
  }

  updateDrift(intensity: number): void {
    if (!this.driftNode) return;
    const now = this.ctx.currentTime;
    this.driftNode.gain.gain.setTargetAtTime(0.16 * intensity, now, 0.05);
    this.driftNode.filter.frequency.setTargetAtTime(900 + intensity * 900, now, 0.1);
  }

  stopDrift(): void {
    if (!this.driftNode) return;
    const { source, gain } = this.driftNode;
    const now = this.ctx.currentTime;
    gain.gain.setTargetAtTime(0, now, 0.08);
    setTimeout(() => source.stop(), 300);
    this.driftNode = undefined;
  }

  playCrash(severity = 0.6): void {
    const now = this.ctx.currentTime;
    // Low thump
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.35 * severity, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(oscGain);
    oscGain.connect(this.destination);
    osc.start(now);
    osc.stop(now + 0.32);

    // Noise crunch
    const src = this.noiseSource();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4 * severity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.destination);
    src.start(now);
    src.stop(now + 0.42);
  }

  playNitro(): void {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.4);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain);
    gain.connect(this.destination);
    osc.start(now);
    osc.stop(now + 0.62);

    const src = this.noiseSource();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.12, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    src.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.destination);
    src.start(now);
    src.stop(now + 0.52);
  }

  playCoin(): void {
    this.playBeep(880, 0.08, 'sine', 0.15);
    setTimeout(() => this.playBeep(1320, 0.12, 'sine', 0.12), 60);
  }

  playCheckpoint(): void {
    this.playBeep(660, 0.1, 'triangle', 0.16);
  }

  playCountdownBeep(final = false): void {
    this.playBeep(final ? 880 : 520, final ? 0.35 : 0.15, 'square', 0.18);
  }

  playUIClick(): void {
    this.playBeep(440, 0.04, 'square', 0.08);
  }

  playUIConfirm(): void {
    this.playBeep(520, 0.05, 'sine', 0.12);
    setTimeout(() => this.playBeep(780, 0.08, 'sine', 0.1), 40);
  }

  playAchievement(): void {
    [523, 659, 784, 1046].forEach((freq, i) => {
      setTimeout(() => this.playBeep(freq, 0.18, 'triangle', 0.14), i * 90);
    });
  }

  private playBeep(freq: number, duration: number, type: OscillatorType, volume: number): void {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }
}
