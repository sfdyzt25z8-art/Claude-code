import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGameStore } from '@/store/gameStore';
import { loadLocalSave, saveLocalSave } from '@/lib/localSave';
import { loadGameFromCloud, saveGameToCloud } from '@/lib/firestoreGame';
import { createInitialState, computeNetWorth } from '@/lib/gameEngine';
import type { GameState } from '@/types/game';

const LOCAL_SAVE_INTERVAL_MS = 3000;
const CLOUD_SAVE_INTERVAL_MS = 20000;
const TICK_INTERVAL_MS = 1000;

/**
 * Bridges the authenticated user to the game store: loads the freshest save
 * (cloud vs. local, whichever is newer) on login, runs the 1s tick loop, and
 * autosaves to localStorage always and Firestore when signed in (non-guest).
 */
export function useGameSync() {
  const { user } = useAuth();
  const isLoaded = useGameStore((s) => s.isLoaded);
  const activeUid = useGameStore((s) => s.activeUid);

  useEffect(() => {
    if (!user || activeUid === user.uid) return;
    let cancelled = false;

    async function load() {
      if (!user) return;
      const local = loadLocalSave(user.uid);
      let cloud: GameState | null = null;
      if (!user.isGuest) {
        try {
          const cloudResult = await loadGameFromCloud(user.uid);
          cloud = cloudResult?.state ?? null;
        } catch {
          cloud = null;
        }
      }
      let initial: GameState;
      if (cloud && local) {
        initial = cloud.lastSavedAt >= local.lastSavedAt ? cloud : local;
      } else {
        initial = cloud ?? local ?? createInitialState();
      }
      if (!cancelled) useGameStore.getState().loadForUser(user.uid, initial);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, activeUid]);

  useEffect(() => {
    if (!isLoaded) return;
    const id = setInterval(() => useGameStore.getState().tick(1), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const id = setInterval(() => {
      const snapshot = useGameStore.getState().state;
      saveLocalSave(user.uid, { ...snapshot, lastSavedAt: Date.now() });
    }, LOCAL_SAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isLoaded, user]);

  useEffect(() => {
    if (!isLoaded || !user || user.isGuest) return;
    const id = setInterval(() => {
      const snapshot = useGameStore.getState().state;
      const netWorth = computeNetWorth(snapshot);
      const saved: GameState = { ...snapshot, lastSavedAt: Date.now() };
      saveGameToCloud(
        {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: snapshot.gameStartedAt,
        },
        saved,
        netWorth,
        snapshot.businesses.length,
      ).catch(() => {});
    }, CLOUD_SAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isLoaded, user]);

  useEffect(() => {
    if (!user) {
      useGameStore.setState({ isLoaded: false, activeUid: null });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    function handleUnload() {
      if (!user) return;
      const snapshot = useGameStore.getState().state;
      saveLocalSave(user.uid, { ...snapshot, lastSavedAt: Date.now() });
    }
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user]);
}
