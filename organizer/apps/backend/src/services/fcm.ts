import { getMessagingIfConfigured } from "../lib/firebaseAdmin";

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Sends a push notification to a single device token via Firebase Cloud
 * Messaging. Never throws: if firebase-admin isn't configured, or the send
 * fails (e.g. stale/invalid token), it logs and returns false instead of
 * blowing up the calling request.
 */
export async function sendPushToToken(token: string, payload: PushPayload): Promise<boolean> {
  const messaging = getMessagingIfConfigured();
  if (!messaging) {
    // eslint-disable-next-line no-console
    console.log(
      `[fcm] Firebase Admin not configured - skipping push to token ${token.slice(0, 8)}... ` +
        `("${payload.title}")`
    );
    return false;
  }

  try {
    await messaging.send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    });
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[fcm] Failed to send push to token ${token.slice(0, 8)}...:`, (err as Error).message);
    return false;
  }
}

/** Sends the same push payload to many tokens; returns counts, never throws. */
export async function sendPushToTokens(
  tokens: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const results = await Promise.all(tokens.map((token) => sendPushToToken(token, payload)));
  const sent = results.filter(Boolean).length;
  return { sent, failed: results.length - sent };
}
