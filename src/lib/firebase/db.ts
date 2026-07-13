/**
 * Typed Firestore access layer.
 *
 * Collection layout (all couple data lives under couples/{coupleId}/...):
 *   users/{uid}
 *   couples/{coupleId}
 *     messages/{messageId}
 *     timeline/{memoryId}
 *     calendar/{eventId}
 *     habits/{habitId}
 *     moods/{date_uid}
 *     bucketList/{itemId}
 *     letters/{letterId}
 *     scores/{scoreId}
 *     achievements/{achievementId}
 *     notes/{noteId}
 *     locations/{uid}
 *     notifications/{notificationId}
 *     meta/settings
 *   inviteCodes/{code} -> { coupleId }
 */
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit as qLimit,
  onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where,
  increment, type DocumentData, type QueryConstraint,
} from "firebase/firestore";
import { auth, db } from "./client";
import type { AppNotification, Couple, UserProfile } from "../types";

export const coupleCol = (coupleId: string, sub: string) =>
  collection(db(), "couples", coupleId, sub);

export const coupleDocRef = (coupleId: string) => doc(db(), "couples", coupleId);
export const userDocRef = (uid: string) => doc(db(), "users", uid);

/* ------------------------------ generic helpers --------------------------- */

export async function addToCouple<T extends DocumentData>(
  coupleId: string, sub: string, data: T,
): Promise<string> {
  const ref = await addDoc(coupleCol(coupleId, sub), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function setInCouple(
  coupleId: string, sub: string, id: string, data: DocumentData, merge = true,
): Promise<void> {
  await setDoc(doc(db(), "couples", coupleId, sub, id), data, { merge });
}

export async function updateInCouple(
  coupleId: string, sub: string, id: string, data: DocumentData,
): Promise<void> {
  await updateDoc(doc(db(), "couples", coupleId, sub, id), data);
}

export async function deleteFromCouple(coupleId: string, sub: string, id: string): Promise<void> {
  await deleteDoc(doc(db(), "couples", coupleId, sub, id));
}

/** Realtime subscription helper — returns the unsubscribe function. */
export function listenToCollection<T>(
  coupleId: string,
  sub: string,
  constraints: QueryConstraint[],
  callback: (items: T[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const q = query(coupleCol(coupleId, sub), ...constraints);
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T)),
    (e) => onError?.(e),
  );
}

export { orderBy, where, qLimit as limitTo, serverTimestamp, increment };

/* ------------------------------ users & couples --------------------------- */

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function fetchCouple(coupleId: string): Promise<Couple | null> {
  const snap = await getDoc(coupleDocRef(coupleId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Couple) : null;
}

/** Award XP + coins to the couple (games, habits, achievements). */
export async function awardXp(coupleId: string, xp: number, coins = 0): Promise<void> {
  await updateDoc(coupleDocRef(coupleId), { xp: increment(xp), coins: increment(coins) });
}

/* ------------------------------- notifications ---------------------------- */

export async function pushAppNotification(
  coupleId: string,
  n: Omit<AppNotification, "id" | "read" | "createdAt">,
): Promise<void> {
  await addDoc(coupleCol(coupleId, "notifications"), {
    ...n, read: false, createdAt: serverTimestamp(),
  });
  // Best-effort web push to the partner's devices. Never block or throw:
  // the in-app notification above is the source of truth; push is a bonus.
  void sendWebPush(coupleId, n);
}

/** Fire an FCM push via the server route. Silent no-op if push isn't set up. */
async function sendWebPush(
  coupleId: string,
  n: Omit<AppNotification, "id" | "read" | "createdAt">,
): Promise<void> {
  try {
    const user = auth().currentUser;
    if (!user) return;
    const idToken = await user.getIdToken();
    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        coupleId, toUid: n.toUid, title: n.title, body: n.body, href: n.href,
      }),
    });
  } catch {
    // offline / route unavailable — the in-app notification still lands.
  }
}

/* --------------------------------- pairing -------------------------------- */

/** Look up a couple by invite code. Returns coupleId or null. */
export async function resolveInviteCode(code: string): Promise<string | null> {
  const snap = await getDocs(
    query(collection(db(), "couples"), where("inviteCode", "==", code.toUpperCase()), qLimit(1)),
  );
  return snap.empty ? null : snap.docs[0].id;
}
