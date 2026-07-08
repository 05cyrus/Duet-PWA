/** Map Firebase auth error codes to friendly copy. */
export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-email": "That email doesn't look right.",
    "auth/user-not-found": "No account with that email yet.",
    "auth/wrong-password": "Wrong password — try again.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/email-already-in-use": "That email already has an account. Try signing in.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/popup-closed-by-user": "The sign-in popup was closed.",
    "auth/popup-blocked": "Your browser blocked the popup — allow popups and retry.",
    "auth/too-many-requests": "Too many attempts. Take a breath and try again shortly.",
    "auth/network-request-failed": "Network hiccup — check your connection.",
    "auth/invalid-phone-number": "Enter the phone number with country code, e.g. +1 555 000 1111.",
    "auth/invalid-verification-code": "That code doesn't match. Double-check and retry.",
    "auth/code-expired": "The code expired — request a new one.",
    "auth/operation-not-allowed": "This sign-in method isn't enabled in Firebase console yet.",
  };
  if (map[code]) return map[code];
  const msg = (e as Error)?.message ?? "";
  if (msg.includes("Firebase is not configured")) return msg;
  return "Something went wrong. Please try again.";
}
