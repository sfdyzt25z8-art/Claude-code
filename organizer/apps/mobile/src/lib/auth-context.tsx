import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { firebaseAuth } from "./firebaseClient";
import { apiGet } from "./api";
import type { User, UserProfile } from "@organizer/shared";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshing: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogleCredential: (idToken: string, accessToken?: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshProfile() {
    if (!firebaseAuth.currentUser) {
      setUser(null);
      setProfile(null);
      return;
    }
    setRefreshing(true);
    try {
      const result = await apiGet<{ user: User; profile: UserProfile | null }>("/api/auth/me");
      setUser(result.user);
      setProfile(result.profile);
    } catch (error) {
      // If the backend can't verify the token yet or the profile doesn't
      // exist, we still keep the firebase session - onboarding/login flows
      // handle the null-profile case.
      console.warn("Failed to refresh profile", error);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (nextUser) => {
      setFirebaseUser(nextUser);
      if (nextUser) {
        await refreshProfile();
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signUp(email: string, password: string) {
    await createUserWithEmailAndPassword(firebaseAuth, email, password);
  }

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(firebaseAuth, email, password);
  }

  async function signInWithGoogleCredential(idToken: string, accessToken?: string) {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    await signInWithCredential(firebaseAuth, credential);
  }

  async function signInWithApple() {
    if (Platform.OS !== "ios") {
      throw new Error("Apple sign-in is only available on iOS.");
    }
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!appleCredential.identityToken) {
      throw new Error("Apple sign-in did not return an identity token.");
    }
    const { OAuthProvider } = await import("firebase/auth");
    const provider = new OAuthProvider("apple.com");
    const credential = provider.credential({
      idToken: appleCredential.identityToken,
    });
    await signInWithCredential(firebaseAuth, credential);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(firebaseAuth, email);
  }

  async function signOutUser() {
    await signOut(firebaseAuth);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      user,
      profile,
      loading,
      refreshing,
      signUp,
      signIn,
      signInWithGoogleCredential,
      signInWithApple,
      resetPassword,
      signOutUser,
      refreshProfile,
    }),
    [firebaseUser, user, profile, loading, refreshing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
