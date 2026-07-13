import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PushBody {
  coupleId?: string;
  toUid?: string; // recipient uid, or "both"
  title?: string;
  body?: string;
  href?: string;
}

/**
 * Sends an FCM web-push to the partner's devices for an in-app notification.
 * Auth: caller sends their Firebase ID token as `Authorization: Bearer <token>`.
 * The caller must be a member of `coupleId`, and we never push the caller's own
 * devices. Tokens are read server-side from users/{uid}.fcmTokens; dead tokens
 * are pruned on delivery failure.
 */
export async function POST(req: NextRequest) {
  const admin = getAdmin();
  if (!admin) {
    // No service account configured — push is optional, so this is not fatal.
    return NextResponse.json({ error: "push-not-configured" }, { status: 501 });
  }

  const authz = req.headers.get("authorization") ?? "";
  const idToken = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  if (!idToken) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let callerUid: string;
  try {
    callerUid = (await admin.auth().verifyIdToken(idToken)).uid;
  } catch {
    return NextResponse.json({ error: "invalid-token" }, { status: 401 });
  }

  let body: PushBody;
  try {
    body = (await req.json()) as PushBody;
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  const { coupleId, toUid, title } = body;
  if (!coupleId || !title) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const dbAdmin = admin.firestore();

  // Authorize: the caller must belong to this couple.
  const coupleSnap = await dbAdmin.doc(`couples/${coupleId}`).get();
  const members = (coupleSnap.get("members") as string[] | undefined) ?? [];
  if (!coupleSnap.exists || !members.includes(callerUid)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Recipients: never push yourself. "both" → the other member(s).
  const recipients = (toUid === "both" || !toUid ? members : [toUid]).filter(
    (uid) => uid && uid !== callerUid,
  );
  if (recipients.length === 0) return NextResponse.json({ sent: 0 });

  // Collect tokens, remembering each token's owner+deviceKey for cleanup.
  const owners: Record<string, { uid: string; key: string }> = {};
  const tokens: string[] = [];
  await Promise.all(
    recipients.map(async (uid) => {
      const snap = await dbAdmin.doc(`users/${uid}`).get();
      const fcm = (snap.get("fcmTokens") as Record<string, string> | undefined) ?? {};
      for (const [key, token] of Object.entries(fcm)) {
        if (typeof token === "string" && token) {
          tokens.push(token);
          owners[token] = { uid, key };
        }
      }
    }),
  );
  if (tokens.length === 0) return NextResponse.json({ sent: 0 });

  const href = body.href || "/dashboard";
  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body: body.body ?? "" },
    webpush: {
      notification: { icon: "/icons/icon-192.png", badge: "/icons/icon-192.png" },
      fcmOptions: { link: href },
    },
    data: { url: href },
  });

  // Prune tokens that are permanently invalid.
  const cleanups: Promise<unknown>[] = [];
  res.responses.forEach((r, i) => {
    if (r.success) return;
    const code = r.error?.code;
    if (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token" ||
      code === "messaging/invalid-argument"
    ) {
      const owner = owners[tokens[i]];
      if (owner) {
        cleanups.push(
          dbAdmin
            .doc(`users/${owner.uid}`)
            .update({ [`fcmTokens.${owner.key}`]: admin.firestore.FieldValue.delete() }),
        );
      }
    }
  });
  await Promise.allSettled(cleanups);

  return NextResponse.json({ sent: res.successCount, failed: res.failureCount });
}
