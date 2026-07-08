import { Timestamp } from "firebase/firestore";
import type { TS } from "./types";

/** Merge class names, skipping falsy values. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Convert a Firestore timestamp-ish value to a JS Date (or null). */
export function toDate(ts: TS): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (ts instanceof Timestamp) return ts.toDate();
  return null;
}

/** Today as a local ISO date string (YYYY-MM-DD). */
export function isoToday(): string {
  return toISODate(new Date());
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole days between two dates (calendar-based, DST safe). */
export function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

/** Days together since an ISO anniversary date. */
export function daysTogether(anniversary: string | null): number {
  if (!anniversary) return 0;
  return Math.max(0, daysBetween(new Date(anniversary + "T00:00:00"), new Date()));
}

/** Relationship level derived from days together + XP. */
export function relationshipLevel(days: number, xp: number): { level: number; title: string; progress: number } {
  const points = days * 10 + xp;
  const level = Math.floor(Math.sqrt(points / 40)) + 1;
  const currFloor = 40 * (level - 1) ** 2;
  const nextFloor = 40 * level ** 2;
  const progress = Math.min(1, (points - currFloor) / (nextFloor - currFloor));
  const titles = [
    "New Sparks", "Sweethearts", "Lovebirds", "Dream Team", "Soul Bond",
    "Inseparable", "Star-Crossed", "Legendary Love", "Eternal Flame",
  ];
  return { level, title: titles[Math.min(titles.length - 1, Math.floor((level - 1) / 3))], progress };
}

/** Short, human friendly time like "14:02" or "Yesterday". */
export function friendlyTime(ts: TS): string {
  const d = toDate(ts);
  if (!d) return "";
  const now = new Date();
  const sameDay = toISODate(d) === toISODate(now);
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (toISODate(d) === toISODate(yesterday)) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

export function formatLongDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString([], {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

/** Random 6-character invite code (unambiguous alphabet). */
export function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return code;
}

/** SHA-256 hex digest — used for letter passphrases. */
export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Escape user text before injecting into rich-text HTML. */
export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

/** Strip scripts/handlers from contentEditable HTML before saving. */
export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach((n) => n.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || (name === "href" && attr.value.trim().toLowerCase().startsWith("javascript:"))) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.innerHTML;
}

/** Simple deterministic hash for picking a daily item from a list. */
export function dailyIndex(listLength: number, salt = 0): number {
  const d = new Date();
  const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate() + salt;
  return seed % listLength;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Compress an image File to a JPEG blob under ~maxDim px. */
export async function compressImage(file: File, maxDim = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", quality),
  );
}
