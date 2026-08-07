import type { EngineSoundProfile } from '../cars/CarTypes';
import { clamp } from '../utils/MathUtils';

/**
 * Procedurally synthesises a continuous engine note using the Web Audio API
 * — no audio files. Pitch and gain track throttle/speed in real time, a
 * gritty waveshaper adds "growl" per the car's sound profile, and an
 * optional high oscillator layers in turbo whine.
 */
export class SynthEngine {
  private ctx: AudioContext;
  private osc?: OscillatorNode;
  private turboOsc?: OscillatorNode;
  private gain: GainNode;
  private turboGain: GainNode;
  private shaper: WaveShaperNode;
  private filter: BiquadFilterNode;
  private profile: EngineSoundProfile;
  private running = false;

  constructor(ctx: AudioContext, destination: AudioNode, profile: EngineSoundProfile) {
    this.ctx = ctx;
    this.profile = profile;
    this.gain = ctx.createGain();
    this.turboGain = ctx.createGain();
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 1800;
    this.shaper = ctx.createWaveShaper();
    this.shaper.curve = makeDistortionCurve(profile.growl * 40);
    this.gain.gain.value = 0;
    this.turboGain.gain.value = 0;

    this.gain.connect(this.filter);
    this.filter.connect(this.shaper);
    this.shaper.connect(destination);
    this.turboGain.connect(destination);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.osc = this.ctx.createOscillator();
    this.osc.type = this.profile.waveform;
    this.osc.frequency.value = this.profile.idleFreq;
    this.osc.connect(this.gain);
    this.osc.start();

    if (this.profile.turboWhine) {
      this.turboOsc = this.ctx.createOscillator();
      this.turboOsc.type = 'sine';
      this.turboOsc.frequency.value = this.profile.maxFreq * 2.2;
      this.turboOsc.connect(this.turboGain);
      this.turboOsc.start();
    }
    this.gain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 0.05);
  }

  /** rpmFrac: 0 (idle) .. 1 (redline). masterVolume: 0..1 SFX bus already applied upstream. */
  update(rpmFrac: number, boosting: boolean): void {
    if (!this.running || !this.osc) return;
    const f = clamp(rpmFrac, 0, 1.15);
    const freq = this.profile.idleFreq + (this.profile.maxFreq - this.profile.idleFreq) * f;
    const now = this.ctx.currentTime;
    this.osc.frequency.setTargetAtTime(freq, now, 0.04);
    this.filter.frequency.setTargetAtTime(600 + f * 3000, now, 0.05);
    const targetGain = 0.035 + f * 0.09 + (boosting ? 0.05 : 0);
    this.gain.gain.setTargetAtTime(targetGain, now, 0.06);

    if (this.turboOsc) {
      this.turboOsc.frequency.setTargetAtTime(this.profile.maxFreq * (1.4 + f * 1.6), now, 0.08);
      this.turboGain.gain.setTargetAtTime(boosting ? 0.02 + f * 0.02 : f > 0.6 ? 0.01 : 0, now, 0.1);
    }
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    const now = this.ctx.currentTime;
    this.gain.gain.setTargetAtTime(0, now, 0.08);
    this.turboGain.gain.setTargetAtTime(0, now, 0.08);
    const osc = this.osc;
    const turbo = this.turboOsc;
    setTimeout(() => {
      osc?.stop();
      turbo?.stop();
    }, 250);
    this.osc = undefined;
    this.turboOsc = undefined;
  }

  destroy(): void {
    this.stop();
    this.gain.disconnect();
    this.turboGain.disconnect();
    this.filter.disconnect();
    this.shaper.disconnect();
  }
}

function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 256;
  const curve = new Float32Array(new ArrayBuffer(samples * 4));
  const k = amount;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}
