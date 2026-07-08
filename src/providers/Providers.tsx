"use client";

import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";
import { AuthProvider } from "./AuthProvider";
import { CoupleProvider } from "./CoupleProvider";

/** Global provider composition for the whole app. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CoupleProvider>{children}</CoupleProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
