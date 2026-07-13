/**
 * Server-side Firebase Admin (used by API routes to send FCM push).
 *
 * Requires a service-account key in FIREBASE_SERVICE_ACCOUNT_KEY — either the
 * raw JSON from Firebase console → Project settings → Service accounts →
 * Generate new private key, or that JSON base64-encoded (safer for env vars,
 * avoids newline issues in the private key). If it's absent, getAdmin()
 * returns null and push sending is skipped gracefully.
 *
 * NEVER import this from client code — it holds server-only credentials.
 */
import * as admin from "firebase-admin";

let cached: typeof admin | null | undefined;

function loadServiceAccount(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      // Env vars often escape newlines — restore them for the PEM key.
      privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
}

/** Initialized firebase-admin, or null when no service account is configured. */
export function getAdmin(): typeof admin | null {
  if (cached !== undefined) return cached;
  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    console.warn("Push disabled: FIREBASE_SERVICE_ACCOUNT_KEY is not set / invalid.");
    cached = null;
    return null;
  }
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  cached = admin;
  return admin;
}
