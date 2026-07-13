/**
 * Web push via Firebase Cloud Messaging.
 *
 * Requires NEXT_PUBLIC_FIREBASE_VAPID_KEY (Web Push certificate key pair
 * from Firebase console > Cloud Messaging). Tokens are stored on the user
 * document so a backend (Cloud Function / cron) can send pushes.
 */
import { userDocRef } from "./db";
import { setDoc } from "firebase/firestore";

export async function enablePushNotifications(uid: string): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("Push disabled: NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set.");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  try {
    const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) return false;

    // Wait for the service worker, but never hang: with no SW registered
    // (e.g. a dev build where registration is skipped) `.ready` resolves never.
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    if (!registration) {
      console.warn(
        "Push: service worker not ready within 5s — is it registered? " +
          "(run a production build, or ensure /sw.js registers).",
      );
      return false;
    }
    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return false;

    const deviceKey = token.slice(0, 16);
    await setDoc(userDocRef(uid), { fcmTokens: { [deviceKey]: token } }, { merge: true });
    return true;
  } catch (e) {
    console.warn("Failed to enable push notifications", e);
    return false;
  }
}

/** Foreground message handler — shows a system notification. */
export async function listenForegroundMessages(): Promise<void> {
  try {
    const { getMessaging, onMessage, isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) return;
    onMessage(getMessaging(), (payload) => {
      const title = payload.notification?.title ?? "Duet 💞";
      const body = payload.notification?.body ?? "";
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/icons/icon-192.png" });
      }
    });
  } catch {
    // messaging unsupported (e.g. iOS Safari before 16.4) — ignore.
  }
}
