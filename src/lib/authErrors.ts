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
    "auth/cancelled-popup-request": "Only one sign-in popup at a time — try again.",
    "auth/unauthorized-domain": "This domain isn't authorized. Add it in Firebase console → Authentication → Settings → Authorized domains.",
    "auth/configuration-not-found": "Google sign-in isn't fully set up. Enable the Google provider in Firebase console → Authentication → Sign-in method.",
    "auth/internal-error": "Sign-in service error — check the Google provider is enabled and configured in Firebase console.",
    "auth/invalid-phone-number": "Enter the phone number with country code, e.g. +1 555 000 1111.",
    "auth/invalid-verification-code": "That code doesn't match. Double-check and retry.",
    "auth/code-expired": "The code expired — request a new one.",
    "auth/operation-not-allowed": "This sign-in method isn't enabled in Firebase console yet.",
  };
  if (map[code]) return map[code];
  const msg = (e as Error)?.message ?? "";
  if (msg.includes("Firebase is not configured")) return msg;
  return code
    ? `Something went wrong (${code}). Please try again.`
    : "Something went wrong. Please try again.";
}
