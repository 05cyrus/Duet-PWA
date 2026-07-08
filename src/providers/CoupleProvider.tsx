"use client";

import {
  arrayUnion, collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc,
} from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase/client";
import { resolveInviteCode } from "@/lib/firebase/db";
import type { Couple } from "@/lib/types";
import { generateInviteCode } from "@/lib/utils";
import { useAuth } from "./AuthProvider";

interface CoupleContextValue {
  couple: Couple | null;
  coupleId: string | null;
  /** True while we don't yet know whether the user has a couple. */
  loading: boolean;
  /** The other member's uid/name/photo (null until partner joins). */
  partnerUid: string | null;
  partnerName: string;
  partnerPhoto: string | null;
  myName: string;
  isPaired: boolean;
  createCouple: (coupleName: string) => Promise<string>;
  joinCouple: (inviteCode: string) => Promise<boolean>;
  setAnniversary: (isoDate: string) => Promise<void>;
  updateCouple: (data: Partial<Couple>) => Promise<void>;
}

const CoupleContext = createContext<CoupleContextValue | null>(null);

export function CoupleProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, loading: authLoading } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [coupleLoading, setCoupleLoading] = useState(true);

  const coupleId = profile?.coupleId ?? null;

  useEffect(() => {
    if (!coupleId) {
      setCouple(null);
      if (!authLoading) setCoupleLoading(!profile && !!user);
      return;
    }
    setCoupleLoading(true);
    return onSnapshot(doc(db(), "couples", coupleId), (snap) => {
      setCouple(snap.exists() ? ({ id: snap.id, ...snap.data() } as Couple) : null);
      setCoupleLoading(false);
    });
  }, [coupleId, authLoading, profile, user]);

  const createCouple = useCallback(async (coupleName: string): Promise<string> => {
    if (!user) throw new Error("Not signed in");
    const ref = doc(collection(db(), "couples"));
    const code = generateInviteCode();
    await setDoc(ref, {
      members: [user.uid],
      memberNames: { [user.uid]: user.displayName ?? "Me" },
      memberPhotos: { [user.uid]: user.photoURL ?? null },
      inviteCode: code,
      anniversary: null,
      coupleName,
      xp: 0,
      coins: 0,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db(), "users", user.uid), { coupleId: ref.id });
    return code;
  }, [user]);

  const joinCouple = useCallback(async (inviteCode: string): Promise<boolean> => {
    if (!user) throw new Error("Not signed in");
    const id = await resolveInviteCode(inviteCode.trim());
    if (!id) return false;
    await updateDoc(doc(db(), "couples", id), {
      members: arrayUnion(user.uid),
      [`memberNames.${user.uid}`]: user.displayName ?? "Me",
      [`memberPhotos.${user.uid}`]: user.photoURL ?? null,
    });
    await updateDoc(doc(db(), "users", user.uid), { coupleId: id });
    return true;
  }, [user]);

  const setAnniversary = useCallback(async (isoDate: string) => {
    if (!coupleId) return;
    await updateDoc(doc(db(), "couples", coupleId), { anniversary: isoDate });
  }, [coupleId]);

  const updateCouple = useCallback(async (data: Partial<Couple>) => {
    if (!coupleId) return;
    await updateDoc(doc(db(), "couples", coupleId), data);
  }, [coupleId]);

  const value = useMemo<CoupleContextValue>(() => {
    const partnerUid = couple?.members.find((m) => m !== user?.uid) ?? null;
    return {
      couple,
      coupleId: couple?.id ?? null,
      loading: authLoading || (Boolean(coupleId) && coupleLoading),
      partnerUid,
      partnerName: partnerUid ? couple?.memberNames[partnerUid] ?? "Partner" : "Partner",
      partnerPhoto: partnerUid ? couple?.memberPhotos[partnerUid] ?? null : null,
      myName: user ? couple?.memberNames[user.uid] ?? user.displayName ?? "Me" : "Me",
      isPaired: (couple?.members.length ?? 0) >= 2,
      createCouple, joinCouple, setAnniversary, updateCouple,
    };
  }, [couple, coupleId, coupleLoading, authLoading, user, createCouple, joinCouple, setAnniversary, updateCouple]);

  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>;
}

export function useCouple(): CoupleContextValue {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error("useCouple must be used inside <CoupleProvider>");
  return ctx;
}
