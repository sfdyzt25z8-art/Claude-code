import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit as fsLimit,
  getDocs,
} from 'firebase/firestore';
import { firestoreDb, isFirebaseConfigured } from '@/lib/firebase';
import type { GameState, LeaderboardEntry, PlayerProfile } from '@/types/game';

interface UserDocShape {
  profile: PlayerProfile;
  gameState: GameState;
  netWorth: number;
  level: number;
  businessCount: number;
  updatedAt: number;
}

export async function saveGameToCloud(
  profile: PlayerProfile,
  state: GameState,
  netWorth: number,
  businessCount: number,
): Promise<void> {
  if (!isFirebaseConfigured || !firestoreDb) return;
  const ref = doc(firestoreDb, 'users', profile.uid);
  const payload: UserDocShape = {
    profile,
    gameState: state,
    netWorth,
    level: state.level,
    businessCount,
    updatedAt: Date.now(),
  };
  await setDoc(ref, payload, { merge: true });
}

export async function loadGameFromCloud(
  uid: string,
): Promise<{ state: GameState; profile: PlayerProfile } | null> {
  if (!isFirebaseConfigured || !firestoreDb) return null;
  const ref = doc(firestoreDb, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as UserDocShape;
  return { state: data.gameState, profile: data.profile };
}

export async function fetchLeaderboard(
  sortBy: 'netWorth' | 'level' | 'businessCount' = 'netWorth',
  take = 25,
): Promise<LeaderboardEntry[]> {
  if (!isFirebaseConfigured || !firestoreDb) return [];
  const usersRef = collection(firestoreDb, 'users');
  const q = query(usersRef, orderBy(sortBy, 'desc'), fsLimit(take));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as UserDocShape;
    return {
      uid: data.profile.uid,
      displayName: data.profile.displayName,
      photoURL: data.profile.photoURL ?? null,
      netWorth: data.netWorth,
      level: data.level,
      businessCount: data.businessCount,
      updatedAt: data.updatedAt,
    };
  });
}
