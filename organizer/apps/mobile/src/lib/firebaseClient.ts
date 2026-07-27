import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  type Auth,
} from "firebase/auth";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

/**
 * Firebase web config, read from EXPO_PUBLIC_* env vars so they're inlined
 * into the JS bundle at build time (Expo's convention for client-exposed
 * env vars — see https://docs.expo.dev/guides/environment-variables/).
 *
 * We do NOT use @react-native-firebase (the native-module SDK) because it
 * requires a custom dev client / bare workflow setup; the plain `firebase`
 * JS SDK works in Expo Go and managed builds with AsyncStorage-backed
 * persistence, matching the web app's auth surface closely enough that the
 * two clients can share mental model and API contract.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

function resolveConfigValue(key: keyof typeof firebaseConfig): string | undefined {
  return (
    firebaseConfig[key] ??
    (Constants.expoConfig?.extra?.firebase as Record<string, string> | undefined)?.[key]
  );
}

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp({
      apiKey: resolveConfigValue("apiKey"),
      authDomain: resolveConfigValue("authDomain"),
      projectId: resolveConfigValue("projectId"),
      appId: resolveConfigValue("appId"),
      messagingSenderId: resolveConfigValue("messagingSenderId"),
    });

// initializeAuth must only be called once per app instance; guard against
// Fast Refresh re-invoking this module during development.
let authInstance: Auth;
try {
  authInstance = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialized (e.g. Fast Refresh) - fall back to the existing
  // instance via a lazy require to avoid circular import issues.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getAuth } = require("firebase/auth");
  authInstance = getAuth(firebaseApp);
}

export const firebaseAuth = authInstance;
