"use client";

import {
  ConfirmationResult, GoogleAuthProvider, RecaptchaVerifier, User,
  createUserWithEmailAndPassword, getRedirectResult, onAuthStateChanged,
  sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPhoneNumber,
  signInWithPopup, signInWithRedirect, signOut as fbSignOut, updateProfile,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { auth, db, firebaseConfigured } from "@/lib/firebase/client";
import type { UserProfile } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  /** True until the initial auth state is known. */
  loading: boolean;
  configured: boolean;
  signInGoogle: () => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Phone OTP: send code (invisible reCAPTCHA in the given container). */
  sendOtp: (phone: string, containerId: string) => Promise<ConfirmationResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Create/refresh the users/{uid} profile document after any sign-in. */
async function ensureUserDoc(u: User): Promise<void> {
  await setDoc(
    doc(db(), "users", u.uid),
    {
      uid: u.uid,
      displayName: u.displayName ?? u.email?.split("@")[0] ?? "Sweetheart",
      email: u.email,
      photoURL: u.photoURL,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    // Complete any pending redirect sign-in (no-op for popup / normal loads).
    getRedirectResult(auth()).catch(() => {
      // Surfaced on next interaction; onAuthStateChanged still drives UI state.
    });
    return onAuthStateChanged(auth(), async (u) => {
      setUser(u);
      if (u) {
        try {
          await ensureUserDoc(u);
        } catch {
          // offline first-launch: profile doc sync will retry via Firestore queue
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  // Live profile subscription (coupleId changes when pairing completes).
  useEffect(() => {
    if (!user || !firebaseConfigured) return;
    return onSnapshot(doc(db(), "users", user.uid), (snap) => {
      if (snap.exists()) setProfile(snap.data() as UserProfile);
    });
  }, [user]);

  const signInGoogle = useCallback(async () => {
    // Popup is the reliable flow for a cross-domain authDomain on localhost:
    // signInWithRedirect needs to carry state back across the
    // localhost → firebaseapp.com → Google hops, which modern browsers break by
    // partitioning third-party storage (the page returns blank). The popup's
    // COOP "window.closed" warning is non-fatal — the result arrives over a
    // separate channel. Fall back to redirect only if the popup is truly
    // blocked by the browser.
    try {
      await signInWithPopup(auth(), new GoogleAuthProvider());
    } catch (e) {
      if ((e as { code?: string })?.code === "auth/popup-blocked") {
        await signInWithRedirect(auth(), new GoogleAuthProvider());
        return;
      }
      throw e;
    }
  }, []);

  const signUpEmail = useCallback(async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth(), email, password);
    await updateProfile(cred.user, { displayName: name });
    await ensureUserDoc({ ...cred.user, displayName: name } as User);
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth(), email, password);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth(), email);
  }, []);

  const sendOtp = useCallback(async (phone: string, containerId: string) => {
    const verifier = new RecaptchaVerifier(auth(), containerId, { size: "invisible" });
    try {
      return await signInWithPhoneNumber(auth(), phone, verifier);
    } finally {
      verifier.clear();
    }
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth());
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, profile, loading, configured: firebaseConfigured,
        signInGoogle, signUpEmail, signInEmail, resetPassword, sendOtp, signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
