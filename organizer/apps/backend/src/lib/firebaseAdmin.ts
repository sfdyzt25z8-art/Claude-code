import type { App } from "firebase-admin/app";
import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * Lazily-initialized Firebase Admin app.
 *
 * We never crash the process if Firebase credentials are missing (this sandbox
 * / early dev environments may not have a real Firebase project configured
 * yet). Instead, initialization is deferred until the first call to
 * `verifyIdToken`, and a clear one-time warning is logged if credentials are
 * absent so requests fail loudly (401) rather than the whole server refusing
 * to boot.
 */

let app: App | null = null;
let initAttempted = false;
let warnedMissingCreds = false;

function tryInitFirebaseAdmin(): App | null {
  if (app || initAttempted) return app;
  initAttempted = true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    if (!warnedMissingCreds) {
      // eslint-disable-next-line no-console
      console.warn(
        "[firebaseAdmin] FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY " +
          "are not fully configured. Firebase ID token verification is disabled until they " +
          "are set. Set ALLOW_DEV_AUTH_BYPASS=true for local development without Firebase."
      );
      warnedMissingCreds = true;
    }
    return null;
  }

  // Service account keys are often pasted into .env with escaped newlines.
  const privateKey = rawPrivateKey.includes("\\n")
    ? rawPrivateKey.replace(/\\n/g, "\n")
    : rawPrivateKey;

  // Require lazily so that when credentials are absent we never pay the cost
  // (or risk) of touching the firebase-admin SDK at all.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { initializeApp, cert, getApps } = require("firebase-admin/app");

  const existing = getApps();
  app =
    existing.length > 0
      ? existing[0]
      : initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });

  return app;
}

export function isFirebaseAdminConfigured(): boolean {
  return tryInitFirebaseAdmin() !== null;
}

/**
 * Verifies a Firebase ID token and returns its decoded claims.
 * Throws if Firebase Admin isn't configured or the token is invalid/expired.
 */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  const firebaseApp = tryInitFirebaseAdmin();
  if (!firebaseApp) {
    throw new Error(
      "Firebase Admin is not configured on this server (missing FIREBASE_* env vars)."
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getAuth } = require("firebase-admin/auth");
  return getAuth(firebaseApp).verifyIdToken(idToken);
}

/**
 * Returns the firebase-admin Messaging client, or null if Firebase Admin
 * isn't configured. Callers must handle the null case gracefully (log +
 * no-op) rather than throwing, per the push-notification requirements.
 */
export function getMessagingIfConfigured(): import("firebase-admin/messaging").Messaging | null {
  const firebaseApp = tryInitFirebaseAdmin();
  if (!firebaseApp) return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getMessaging } = require("firebase-admin/messaging");
  return getMessaging(firebaseApp);
}
