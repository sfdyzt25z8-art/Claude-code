import type { WeatherType } from '../utils/Constants';

const SCALE_MINOR = [0, 3, 5, 7, 10, 12, 15]; // pentatonic-ish minor, semitone offsets
const ROOT_FREQ = 110; // A2

interface ChordStep {
  rootOffset: number; // scale index for chord root
  notes: number[]; // scale indices relative to root
}

const PROGRESSION: ChordStep[] = [
  { rootOffset: 0, notes: [0, 2, 4] },
  { rootOffset: 4, notes: [0, 2, 4] },
  { rootOffset: 2, notes: [0, 2, 4] },
  { rootOffset: 3, notes: [0, 2, 4] },
];

/**
 * A tiny generative music + ambience engine. Instead of streaming an audio
 * file, it schedules a synth arpeggio/pad loop driven by a fixed chord
 * progression, and layers weather ambience (rain/wind) as filtered noise
 * beds. Fully procedural, loops indefinitely, responds instantly to volume
 * changes.
 */
export class MusicManager {
  private ctx: AudioContext;
  private destination: AudioNode;
  private noiseBuffer: AudioBuffer;
  private playing = false;
  private nextStepTime = 0;
  private stepIndex = 0;
  private schedulerHandle?: number;
  private padGain: GainNode;
  private ambientGain: GainNode;
  private ambientSource?: AudioBufferSourceNode;
  private ambientFilter?: BiquadFilterNode;
  private tempoBpm = 96;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
    this.noiseBuffer = this.buildNoiseBuffer();
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0.5;
    this.padGain.connect(destination);
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0;
    this.ambientGain.connect(destination);
  }

  private buildNoiseBuffer(): AudioBuffer {
    const length = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  setVolume(volume: number): void {
    this.padGain.gain.setTargetAtTime(volume * 0.5, this.ctx.currentTime, 0.2);
  }

  start(intensity: 'menu' | 'race' = 'menu'): void {
    if (this.playing) return;
    this.playing = true;
    this.tempoBpm = intensity === 'race' ? 128 : 92;
    this.stepIndex = 0;
    this.nextStepTime = this.ctx.currentTime + 0.1;
    const tick = () => {
      if (!this.playing) return;
      while (this.nextStepTime < this.ctx.currentTime + 0.2) {
        this.scheduleStep(this.stepIndex, this.nextStepTime);
        const secondsPerStep = 60 / this.tempoBpm;
        this.nextStepTime += secondsPerStep;
        this.stepIndex++;
      }
      this.schedulerHandle = window.setTimeout(tick, 50);
    };
    tick();
  }

  stop(): void {
    this.playing = false;
    if (this.schedulerHandle) window.clearTimeout(this.schedulerHandle);
  }

  private scaleFreq(index: number): number {
    const octave = Math.floor(index / SCALE_MINOR.length);
    const semitone = SCALE_MINOR[((index % SCALE_MINOR.length) + SCALE_MINOR.length) % SCALE_MINOR.length];
    return ROOT_FREQ * Math.pow(2, octave + semitone / 12);
  }

  private scheduleStep(stepIndex: number, time: number): void {
    const chord = PROGRESSION[Math.floor(stepIndex / 4) % PROGRESSION.length];
    const noteInChord = chord.notes[stepIndex % chord.notes.length];
    const freq = this.scaleFreq(chord.rootOffset + noteInChord + 7);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.09, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.55 * (60 / this.tempoBpm));
    osc.connect(gain);
    gain.connect(this.padGain);
    osc.start(time);
    osc.stop(time + 0.6 * (60 / this.tempoBpm));

    // Sub-bass pad on the first beat of each bar
    if (stepIndex % 4 === 0) {
      const bass = this.ctx.createOscillator();
      bass.type = 'sine';
      bass.frequency.value = this.scaleFreq(chord.rootOffset) / 2;
      const bassGain = this.ctx.createGain();
      bassGain.gain.setValueAtTime(0, time);
      bassGain.gain.linearRampToValueAtTime(0.14, time + 0.05);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + (60 / this.tempoBpm) * 3.8);
      bass.connect(bassGain);
      bassGain.connect(this.padGain);
      bass.start(time);
      bass.stop(time + (60 / this.tempoBpm) * 4);
    }
  }

  setAmbience(weather: WeatherType, volume: number): void {
    this.ambientSource?.stop();
    this.ambientSource = undefined;
    if (weather === 'clear' || volume <= 0) {
      this.ambientGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
      return;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = weather === 'rain' ? 'highpass' : weather === 'snow' ? 'lowpass' : 'bandpass';
    filter.frequency.value = weather === 'rain' ? 1600 : weather === 'snow' ? 400 : 900;
    src.connect(filter);
    filter.connect(this.ambientGain);
    src.start();
    this.ambientSource = src;
    this.ambientFilter = filter;
    this.ambientGain.gain.setTargetAtTime(volume * 0.2, this.ctx.currentTime, 0.4);
  }

  setAmbienceVolume(volume: number): void {
    this.ambientGain.gain.setTargetAtTime(volume * 0.2, this.ctx.currentTime, 0.2);
  }
}
