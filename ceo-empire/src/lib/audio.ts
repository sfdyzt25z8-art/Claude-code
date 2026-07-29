// Lightweight synthesized SFX/music engine using the Web Audio API.
// No external audio assets required — everything here is generated tones.

export type SoundKind =
  | 'buy'
  | 'upgrade'
  | 'hire'
  | 'invest'
  | 'reward'
  | 'achievement'
  | 'levelup'
  | 'error'
  | 'click';

let ctx: AudioContext | null = null;
let soundEnabled = true;
let musicNodes: { oscillators: OscillatorNode[]; gain: GainNode } | null = null;

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!ctx) ctx = new AudioContextCtor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

function tone(
  audio: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = 'sine',
  peak = 0.16,
) {
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, now + startOffset);
  gain.gain.linearRampToValueAtTime(peak, now + startOffset + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now + startOffset);
  osc.stop(now + startOffset + duration + 0.02);
}

const NOTE = { C5: 523.25, D5: 587.33, E5: 659.25, G4: 392.0, A4: 440.0, B4: 493.88, G5: 783.99, C6: 1046.5, F5: 698.46 };

export function playSound(kind: SoundKind): void {
  if (!soundEnabled) return;
  const audio = ensureContext();
  if (!audio) return;

  switch (kind) {
    case 'buy':
      tone(audio, NOTE.C5, 0, 0.12);
      tone(audio, NOTE.E5, 0.06, 0.14);
      break;
    case 'upgrade':
      tone(audio, NOTE.G4, 0, 0.08);
      tone(audio, NOTE.C5, 0.05, 0.1);
      tone(audio, NOTE.E5, 0.1, 0.14);
      break;
    case 'hire':
      tone(audio, NOTE.A4, 0, 0.1);
      tone(audio, NOTE.B4, 0.05, 0.12);
      break;
    case 'invest':
      tone(audio, NOTE.F5, 0, 0.1);
      tone(audio, NOTE.A4, 0.06, 0.12);
      break;
    case 'reward':
      tone(audio, NOTE.C5, 0, 0.1);
      tone(audio, NOTE.E5, 0.08, 0.1);
      tone(audio, NOTE.G5, 0.16, 0.16);
      break;
    case 'achievement':
      tone(audio, NOTE.E5, 0, 0.12);
      tone(audio, NOTE.G5, 0.1, 0.12);
      tone(audio, 987.77, 0.2, 0.2);
      break;
    case 'levelup':
      tone(audio, NOTE.C5, 0, 0.1);
      tone(audio, NOTE.E5, 0.08, 0.1);
      tone(audio, NOTE.G5, 0.16, 0.1);
      tone(audio, NOTE.C6, 0.24, 0.22);
      break;
    case 'error':
      tone(audio, 180, 0, 0.16, 'sawtooth', 0.12);
      break;
    case 'click':
      tone(audio, NOTE.A4, 0, 0.05, 'sine', 0.06);
      break;
  }
}

const MUSIC_FREQS = [130.81, 164.81, 196.0]; // soft C3-E3-G3 pad

export function setMusicEnabled(enabled: boolean): void {
  const audio = ensureContext();
  if (!audio) return;

  if (enabled) {
    if (musicNodes) return;
    const gain = audio.createGain();
    gain.gain.value = 0;
    gain.connect(audio.destination);
    gain.gain.linearRampToValueAtTime(0.03, audio.currentTime + 2);

    const oscillators = MUSIC_FREQS.map((freq) => {
      const osc = audio.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const oscGain = audio.createGain();
      oscGain.gain.value = 1 / MUSIC_FREQS.length;
      osc.connect(oscGain);
      oscGain.connect(gain);
      osc.start();
      return osc;
    });
    musicNodes = { oscillators, gain };
  } else {
    if (!musicNodes) return;
    const { oscillators, gain } = musicNodes;
    gain.gain.linearRampToValueAtTime(0, audio.currentTime + 1);
    const toStop = oscillators;
    setTimeout(() => {
      for (const osc of toStop) {
        try {
          osc.stop();
        } catch {
          // already stopped
        }
      }
    }, 1100);
    musicNodes = null;
  }
}
