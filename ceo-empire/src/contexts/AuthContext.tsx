import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

export interface AuthedUser {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  isGuest: boolean;
}

interface AuthContextValue {
  user: AuthedUser | null;
  loading: boolean;
  firebaseReady: boolean;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
}

const GUEST_STORAGE_KEY = 'ceo-empire-guest-uid';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthedUser(user: User): AuthedUser {
  return {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'CEO',
    email: user.email,
    photoURL: user.photoURL,
    isGuest: false,
  };
}

function getOrCreateGuestId(): string {
  let id = localStorage.getItem(GUEST_STORAGE_KEY);
  if (!id) {
    id = `guest_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(GUEST_STORAGE_KEY, id);
  }
  return id;
}

function guestUserFromStorage(): AuthedUser | null {
  const id = localStorage.getItem(GUEST_STORAGE_KEY);
  if (!id) return null;
  return { uid: id, displayName: 'Guest CEO', email: null, photoURL: null, isGuest: true };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthedUser | null>(() => guestUserFromStorage());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
      // A real Firebase account always takes precedence over a stale guest session.
      setUser(fbUser ? toAuthedUser(fbUser) : guestUserFromStorage());
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      firebaseReady: isFirebaseConfigured,
      async signUpWithEmail(email, password, displayName) {
        if (!firebaseAuth) throw new Error('Firebase is not configured.');
        const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
        setUser(toAuthedUser({ ...cred.user, displayName } as User));
      },
      async loginWithEmail(email, password) {
        if (!firebaseAuth) throw new Error('Firebase is not configured.');
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      },
      async loginWithGoogle() {
        if (!firebaseAuth) throw new Error('Firebase is not configured.');
        const provider = new GoogleAuthProvider();
        await signInWithPopup(firebaseAuth, provider);
      },
      async resetPassword(email) {
        if (!firebaseAuth) throw new Error('Firebase is not configured.');
        await sendPasswordResetEmail(firebaseAuth, email);
      },
      continueAsGuest() {
        const uid = getOrCreateGuestId();
        setUser({ uid, displayName: 'Guest CEO', email: null, photoURL: null, isGuest: true });
      },
      async logout() {
        localStorage.removeItem(GUEST_STORAGE_KEY);
        if (firebaseAuth && isFirebaseConfigured) {
          await signOut(firebaseAuth);
        }
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
