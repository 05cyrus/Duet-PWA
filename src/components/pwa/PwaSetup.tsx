"use client";

import { useEffect } from "react";
import { listenForegroundMessages } from "@/lib/firebase/messaging";
import { firebaseConfigured } from "@/lib/firebase/client";

/** Registers the service worker and foreground push handler. Renders nothing. */
export function PwaSetup() {
  useEffect(() => {
    // Register in all environments so push notifications can be enabled and
    // tested on localhost. The SW bypasses its own caching on localhost (see
    // sw.js), so dev assets/HMR are never served stale.
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        if (firebaseConfigured) listenForegroundMessages();
      })
      .catch((e) => console.warn("SW registration failed", e));
  }, []);

  return null;
}
