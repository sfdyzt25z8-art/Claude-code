"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import type { User, UserProfile } from "@organizer/shared";
import {
  getFirebaseAuth,
  signInWithEmail,
  signInWithGoogle as firebaseSignInWithGoogle,
  signInWithApple as firebaseSignInWithApple,
  signOutUser as firebaseSignOutUser,
  signUpWithEmail,
  resetPasswordEmail,
} from "./firebaseClient";
import { apiGet, ApiError } from "./api";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const data = await apiGet<{ user: User; profile: UserProfile | null }>("/api/auth/me");
      setUser(data.user);
      setProfile(data.profile);
    } catch (err) {
      // If the backend hasn't provisioned the user yet (first sign-in) or the
      // request fails, keep firebase auth state but leave profile null so the
      // app shell can route the user to onboarding.
      setUser(null);
      setProfile(null);
      if (!(err instanceof ApiError)) {
        console.error("Failed to load current user", err);
      }
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await loadMe();
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [loadMe]);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      user,
      profile,
      loading,
      refreshProfile: loadMe,
      signUp: async (email, password, name) => {
        await signUpWithEmail(email, password, name);
      },
      signIn: async (email, password) => {
        await signInWithEmail(email, password);
      },
      signInWithGoogle: async () => {
        await firebaseSignInWithGoogle();
      },
      signInWithApple: async () => {
        await firebaseSignInWithApple();
      },
      signOutUser: async () => {
        await firebaseSignOutUser();
        setUser(null);
        setProfile(null);
      },
      resetPassword: async (email) => {
        await resetPasswordEmail(email);
      },
    }),
    [firebaseUser, user, profile, loading, loadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
