import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const maxDuration = 30;

type ChatInput = { role: "user" | "assistant"; content: string };
async function isAuthenticated() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => { try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Read-only render context. */ } }
    }
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  return Boolean(user && !error);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("message" in body) || typeof body.message !== "string") {
      return NextResponse.json({ error: "Please provide a question." }, { status: 400 });
    }
    const message = body.message.trim();
    if (!message || message.length > 6000) return NextResponse.json({ error: "Your question must be between 1 and 6,000 characters." }, { status: 400 });
    if (!await isAuthenticated()) return NextResponse.json({ error: "Sign in to use the AI tutor." }, { status: 401 });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI is not configured yet. Add OPENAI_API_KEY in your deployment environment." }, { status: 503 });

    const history: ChatInput[] = Array.isArray((body as Record<string, unknown>).history)
      ? ((body as Record<string, unknown>).history as unknown[]).slice(-12).flatMap((item): ChatInput[] => {
          if (!item || typeof item !== "object") return [];
          const candidate = item as Record<string, unknown>;
          if ((candidate.role !== "user" && candidate.role !== "assistant") || typeof candidate.content !== "string") return [];
          const content = candidate.content.trim().slice(0, 3000);
          return content ? [{ role: candidate.role, content }] : [];
        })
      : [];

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", temperature: 0.4, max_tokens: 900, messages: [
        { role: "system", content: "You are SONA, a patient study tutor and student productivity assistant. Use recent conversation context to understand follow-ups. Explain clearly, show steps for problems, encourage active recall, admit uncertainty, and never invent citations or claim to have read a document that was not provided. Keep answers focused and student-friendly. Never claim to have changed files, calendars, or device settings unless a connected tool actually did so." },
        ...history,
        { role: "user", content: message }
      ] }), signal: AbortSignal.timeout(25000)
    });
    if (!upstream.ok) return NextResponse.json({ error: upstream.status === 429 ? "The AI service is busy or its quota has been reached. Try again shortly." : "The AI service could not answer right now. Check server configuration and try again." }, { status: upstream.status === 429 ? 429 : 502 });
    const data = await upstream.json(), answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) return NextResponse.json({ error: "The AI returned an empty response. Please try again." }, { status: 502 });
    return NextResponse.json({ answer: answer.trim() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to process this request. Please try again." }, { status: 400 });
  }
}
