import type { EngineSoundProfile } from '../cars/CarTypes';
import type { WeatherType } from '../utils/Constants';
import { SynthEngine } from './SynthEngine';
import { SfxSynth } from './SfxSynth';
import { MusicManager } from './MusicManager';

export interface AudioVolumes {
  master: number; // 0-1
  music: number; // 0-1
  sfx: number; // 0-1
}

/**
 * Central audio facade. Owns the single shared AudioContext and mixes three
 * buses (music / sfx / engine-through-sfx) down to a master gain. Every
 * sound in the game — engine notes, tire screech, crashes, nitro, UI chimes,
 * ambience — is synthesised in real time; there are no audio files to load,
 * so audio is available the instant the context resumes.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain?: GainNode;
  private sfxGain?: GainNode;
  private musicBus?: GainNode;
  private sfx?: SfxSynth;
  private music?: MusicManager;
  private playerEngine?: SynthEngine;
  private volumes: AudioVolumes = { master: 0.85, music: 0.55, sfx: 0.85 };
  private unlocked = false;

  /** Must be called from a user-gesture handler (click/tap) due to browser autoplay policy. */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volumes.master;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.volumes.sfx;
    this.sfxGain.connect(this.masterGain);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = this.volumes.music;
    this.musicBus.connect(this.masterGain);

    this.sfx = new SfxSynth(this.ctx, this.sfxGain);
    this.music = new MusicManager(this.ctx, this.musicBus);

    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  get isUnlocked(): boolean {
    return this.unlocked;
  }

  setVolumes(volumes: Partial<AudioVolumes>): void {
    this.volumes = { ...this.volumes, ...volumes };
    const now = this.ctx?.currentTime ?? 0;
    this.masterGain?.gain.setTargetAtTime(this.volumes.master, now, 0.1);
    this.sfxGain?.gain.setTargetAtTime(this.volumes.sfx, now, 0.1);
    this.musicBus?.gain.setTargetAtTime(this.volumes.music, now, 0.1);
  }

  getVolumes(): AudioVolumes {
    return { ...this.volumes };
  }

  playMusic(mode: 'menu' | 'race'): void {
    this.music?.start(mode);
  }

  stopMusic(): void {
    this.music?.stop();
  }

  setAmbience(weather: WeatherType): void {
    this.music?.setAmbience(weather, this.volumes.sfx);
  }

  startPlayerEngine(profile: EngineSoundProfile): void {
    if (!this.ctx || !this.sfxGain) return;
    this.playerEngine?.destroy();
    this.playerEngine = new SynthEngine(this.ctx, this.sfxGain, profile);
    this.playerEngine.start();
  }

  updatePlayerEngine(rpmFrac: number, boosting: boolean): void {
    this.playerEngine?.update(rpmFrac, boosting);
  }

  stopPlayerEngine(): void {
    this.playerEngine?.destroy();
    this.playerEngine = undefined;
  }

  screech(intensity?: number): void {
    this.sfx?.playTireScreech(intensity);
  }

  startDrift(): void {
    this.sfx?.startDrift();
  }

  updateDrift(intensity: number): void {
    this.sfx?.updateDrift(intensity);
  }

  stopDrift(): void {
    this.sfx?.stopDrift();
  }

  crash(severity?: number): void {
    this.sfx?.playCrash(severity);
  }

  nitro(): void {
    this.sfx?.playNitro();
  }

  coin(): void {
    this.sfx?.playCoin();
  }

  checkpoint(): void {
    this.sfx?.playCheckpoint();
  }

  countdown(final = false): void {
    this.sfx?.playCountdownBeep(final);
  }

  uiClick(): void {
    this.sfx?.playUIClick();
  }

  uiConfirm(): void {
    this.sfx?.playUIConfirm();
  }

  achievement(): void {
    this.sfx?.playAchievement();
  }
}

/** App-wide singleton — one AudioContext for the whole game. */
export const audioManager = new AudioManager();
