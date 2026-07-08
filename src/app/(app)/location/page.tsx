"use client";

import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toggle } from "@/components/ui/Toggle";
import { db } from "@/lib/firebase/client";
import { pushAppNotification } from "@/lib/firebase/db";
import type { LocationShare } from "@/lib/types";
import { friendlyTime } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useToast } from "@/providers/ToastProvider";

/** Haversine distance in km. */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export default function LocationPage() {
  const { user } = useAuth();
  const { coupleId, couple, partnerUid, partnerName, myName } = useCouple();
  const { toast } = useToast();

  const [sharing, setSharing] = useState(false);
  const [mine, setMine] = useState<LocationShare | null>(null);
  const [theirs, setTheirs] = useState<LocationShare | null>(null);
  const watchId = useRef<number | null>(null);

  // Subscribe to both location docs.
  useEffect(() => {
    if (!coupleId || !user) return;
    const unsubMine = onSnapshot(doc(db(), "couples", coupleId, "locations", user.uid), (s) => {
      const data = s.exists() ? (s.data() as LocationShare) : null;
      setMine(data);
      setSharing(Boolean(data?.sharing));
    });
    const unsubTheirs = partnerUid
      ? onSnapshot(doc(db(), "couples", coupleId, "locations", partnerUid), (s) =>
          setTheirs(s.exists() ? (s.data() as LocationShare) : null))
      : undefined;
    return () => { unsubMine(); unsubTheirs?.(); };
  }, [coupleId, user, partnerUid]);

  const writePosition = (pos: GeolocationPosition) => {
    if (!coupleId || !user) return;
    setDoc(doc(db(), "couples", coupleId, "locations", user.uid), {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      sharing: true,
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  };

  const toggleSharing = (on: boolean) => {
    if (!coupleId || !user) return;
    if (on) {
      if (!("geolocation" in navigator)) return toast("Geolocation not supported here.", "error");
      watchId.current = navigator.geolocation.watchPosition(
        writePosition,
        () => {
          toast("Location permission needed to share.", "error");
          setSharing(false);
        },
        { enableHighAccuracy: false, maximumAge: 30_000 },
      );
      setSharing(true);
      toast("Live location on 📍", "success");
    } else {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setDoc(doc(db(), "couples", coupleId, "locations", user.uid),
        { sharing: false, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      setSharing(false);
    }
  };

  // Stop watching on unmount (Firestore doc keeps last state).
  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  const arrivedSafely = async () => {
    if (!coupleId || !partnerUid) return;
    await pushAppNotification(coupleId, {
      toUid: partnerUid,
      title: `${myName} arrived safely 🏡`,
      body: "They wanted you to know 💞",
      href: "/location",
    });
    toast(`${partnerName} has been told you're safe 💞`, "success");
  };

  const dist = mine?.sharing && theirs?.sharing ? distanceKm(mine, theirs) : null;
  const walkingEta = dist !== null ? Math.round((dist / 4.8) * 60) : null;   // ~4.8 km/h
  const drivingEta = dist !== null ? Math.round((dist / 40) * 60) : null;    // ~40 km/h city

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader emoji="📍" title="Location" subtitle="Optional — share only when you both want to." />

      <GlassCard className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Share my live location</p>
          <p className="text-xs text-ink-soft">
            Visible only to {partnerName}. Turn off anytime.
          </p>
        </div>
        <Toggle checked={sharing} onChange={toggleSharing} label="Share my live location" />
      </GlassCard>

      {/* Partner status */}
      <GlassCard>
        <div className="flex items-center gap-3">
          <Avatar src={partnerUid ? couple?.memberPhotos[partnerUid] : null} name={partnerName} size={44} />
          <div className="flex-1">
            <p className="text-sm font-bold">{partnerName}</p>
            <p className="text-xs text-ink-soft">
              {theirs?.sharing
                ? `Sharing live · updated ${friendlyTime(theirs.updatedAt)}`
                : "Not sharing right now"}
            </p>
          </div>
          {theirs?.sharing && (
            <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}
              className="size-3 rounded-full bg-emerald-400" aria-label="Live" />
          )}
        </div>

        {dist !== null && (
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/40 py-3 dark:bg-white/5">
              <p className="text-xl font-bold tabular-nums">
                {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
              </p>
              <p className="text-[10px] font-semibold text-ink-soft">apart</p>
            </div>
            <div className="rounded-2xl bg-white/40 py-3 dark:bg-white/5">
              <p className="text-xl font-bold tabular-nums">🚶 {walkingEta}m</p>
              <p className="text-[10px] font-semibold text-ink-soft">walk ETA</p>
            </div>
            <div className="rounded-2xl bg-white/40 py-3 dark:bg-white/5">
              <p className="text-xl font-bold tabular-nums">🚗 {drivingEta}m</p>
              <p className="text-[10px] font-semibold text-ink-soft">drive ETA</p>
            </div>
          </div>
        )}

        {theirs?.sharing && (
          <div className="mt-4 overflow-hidden rounded-2xl">
            <iframe
              title={`${partnerName}'s location`}
              className="h-64 w-full border-0"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${theirs.lng - 0.02}%2C${theirs.lat - 0.012}%2C${theirs.lng + 0.02}%2C${theirs.lat + 0.012}&layer=mapnik&marker=${theirs.lat}%2C${theirs.lng}`}
            />
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${theirs.lat},${theirs.lng}`}
              target="_blank" rel="noreferrer"
              className="block bg-white/50 py-2 text-center text-xs font-bold text-lilac-600 dark:bg-white/10 dark:text-lilac-300"
            >
              Navigate to {partnerName} ↗
            </a>
          </div>
        )}
      </GlassCard>

      <GlassCard className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Safe arrival 🏡</p>
          <p className="text-xs text-ink-soft">One tap tells {partnerName} you made it.</p>
        </div>
        <Button onClick={arrivedSafely}>I arrived safely</Button>
      </GlassCard>
    </div>
  );
}
