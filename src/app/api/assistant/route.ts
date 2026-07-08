import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are "Cupid", the in-app love assistant of Duet, a private couple relationship app.
You help one couple at a time with: date ideas, gift ideas, relationship tips, conversation starters,
fun couple games, trip ideas and food/restaurant suggestions.

Style: warm, playful, encouraging, a few tasteful emojis. Keep answers short and scannable
(bullet lists of 3-6 ideas with one-line explanations). Personalise using any context the user gives
(anniversary, moods, city, budget). You are not a therapist: for serious relationship distress,
abuse, or mental-health crises, gently suggest speaking to a professional. Never ask for or repeat
sensitive personal data. Stay on relationship topics; politely decline anything else.`;

/** Naive per-IP rate limit (best-effort, per server instance). */
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 20; // 20 requests / minute / IP
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Client falls back to the built-in offline suggestion engine.
    return NextResponse.json({ error: "assistant-not-configured" }, { status: 501 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  let turns: ChatTurn[];
  try {
    const body = await req.json();
    turns = (body.messages as ChatTurn[]).slice(-12).filter(
      (t) => (t.role === "user" || t.role === "assistant") && typeof t.content === "string",
    );
    if (turns.length === 0 || turns[turns.length - 1].role !== "user") throw new Error();
    // Input validation: cap message sizes.
    turns = turns.map((t) => ({ role: t.role, content: t.content.slice(0, 2000) }));
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: turns,
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return NextResponse.json({ reply: text });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "rate-limited" }, { status: 429 });
    }
    console.error("Assistant error", e);
    return NextResponse.json({ error: "assistant-error" }, { status: 502 });
  }
}
