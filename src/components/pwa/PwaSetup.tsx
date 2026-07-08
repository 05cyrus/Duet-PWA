"use client";

import { useEffect } from "react";
import { listenForegroundMessages } from "@/lib/firebase/messaging";
import { firebaseConfigured } from "@/lib/firebase/client";

/** Registers the service worker and foreground push handler. Renders nothing. */
export function PwaSetup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        if (firebaseConfigured) listenForegroundMessages();
      })
      .catch((e) => console.warn("SW registration failed", e));
  }, []);

  return null;
}
