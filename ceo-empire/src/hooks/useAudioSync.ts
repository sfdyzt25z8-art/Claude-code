import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { setSoundEnabled, setMusicEnabled } from '@/lib/audio';

/** Keeps the audio engine's enabled flags in sync with the player's settings. */
export function useAudioSync() {
  const soundEnabled = useGameStore((s) => s.state.settings.soundEnabled);
  const musicEnabled = useGameStore((s) => s.state.settings.musicEnabled);

  useEffect(() => {
    setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    setMusicEnabled(musicEnabled);
  }, [musicEnabled]);
}
