import type { Timestamp } from "firebase/firestore";

/** A Firestore timestamp, a Date (optimistic writes) or null while pending. */
export type TS = Timestamp | Date | null;

/* ---------------------------------- users --------------------------------- */

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  coupleId: string | null;
  /** FCM tokens for push notifications, keyed by device. */
  fcmTokens?: Record<string, string>;
  createdAt: TS;
}

/* --------------------------------- couples -------------------------------- */

export interface Couple {
  id: string;
  /** Exactly two member uids once paired. */
  members: string[];
  memberNames: Record<string, string>;
  memberPhotos: Record<string, string | null>;
  /** 6-char invite code used by the partner to join. */
  inviteCode: string;
  /** ISO date string of the anniversary (relationship start). */
  anniversary: string | null;
  coupleName: string;
  /** Gamification totals. */
  xp: number;
  coins: number;
  createdAt: TS;
}

/* ---------------------------------- chat ---------------------------------- */

export type MessageKind = "text";

export interface ChatMessage {
  id: string;
  senderId: string;
  kind: MessageKind;
  text: string;
  pinned: boolean;
  /** uids that have read the message. */
  readBy: string[];
  reactions: Record<string, string>; // uid -> emoji
  createdAt: TS;
}

/* -------------------------------- timeline -------------------------------- */

export type MemoryKind =
  | "first-meet" | "first-date" | "trip" | "anniversary" | "special";

export interface Memory {
  id: string;
  kind: MemoryKind;
  title: string;
  caption: string;
  date: string; // ISO date
  location: string;
  tags: string[];
  createdBy: string;
  createdAt: TS;
}

/* -------------------------------- calendar -------------------------------- */

export type EventKind = "birthday" | "anniversary" | "trip" | "reminder" | "date" | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  kind: EventKind;
  date: string;      // ISO date
  time: string;      // "HH:MM" or ""
  notes: string;
  recurring: "none" | "yearly" | "monthly" | "weekly";
  createdBy: string;
  createdAt: TS;
}

/* ---------------------------------- habits -------------------------------- */

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  /** days of week 0-6 the habit is scheduled, empty = every day. */
  schedule: number[];
  /** ISO date -> uids who completed that day. */
  log: Record<string, string[]>;
  streak: number;
  createdAt: TS;
}

/* ---------------------------------- moods --------------------------------- */

export const MOODS = ["happy", "sad", "excited", "romantic", "angry", "sleepy", "busy"] as const;
export type Mood = (typeof MOODS)[number];

export interface MoodEntry {
  id: string; // `${date}_${uid}`
  uid: string;
  date: string; // ISO date
  mood: Mood;
  note: string;
  createdAt: TS;
}

/* ------------------------------- bucket list ------------------------------ */

export type BucketCategory =
  | "travel" | "restaurants" | "movies" | "dream-house" | "savings" | "other";

export interface BucketItem {
  id: string;
  title: string;
  category: BucketCategory;
  done: boolean;
  /** For savings goals. */
  target?: number;
  saved?: number;
  notes: string;
  createdBy: string;
  createdAt: TS;
  completedAt: TS;
}

/* --------------------------------- letters -------------------------------- */

export interface Letter {
  id: string;
  authorId: string;
  title: string;
  /** Sanitised rich-text HTML. */
  html: string;
  draft: boolean;
  favorite: boolean;
  /** Deliver at — hidden from partner until this time passes. */
  deliverAt: string | null; // ISO datetime
  /** Optional passphrase hash (SHA-256 hex). */
  lockHash: string | null;
  createdAt: TS;
  updatedAt: TS;
}

/* ---------------------------------- games --------------------------------- */

export interface GameScore {
  id: string;
  gameId: string;
  uid: string;
  name: string;
  score: number;
  meta?: Record<string, number | string>;
  createdAt: TS;
}

export interface Achievement {
  id: string;
  uid: string;
  name: string;
  title: string;
  emoji: string;
  xp: number;
  createdAt: TS;
}

/* --------------------------------- letters -------------------------------- */

export interface QuickNote {
  id: string;
  text: string;
  color: string;
  createdBy: string;
  createdAt: TS;
}

/* --------------------------------- location ------------------------------- */

export interface LocationShare {
  id: string; // uid
  lat: number;
  lng: number;
  sharing: boolean;
  updatedAt: TS;
}

/* ------------------------------ notifications ----------------------------- */

export interface AppNotification {
  id: string;
  toUid: string | "both";
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: TS;
}

/* --------------------------------- settings ------------------------------- */

export interface CoupleSettings {
  notifyDailyReminder: boolean;
  notifyAnniversary: boolean;
  notifyHabits: boolean;
  notifyMoods: boolean;
  notifyGames: boolean;
  language: "en";
  locationEnabled: boolean;
}
