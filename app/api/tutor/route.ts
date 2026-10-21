import { NextResponse } from "next/server";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("message" in body) || typeof body.message !== "string") {
      return NextResponse.json({ error: "Please provide a question." }, { status: 400 });
    }
    const message = body.message.trim();
    if (!message || message.length > 6000) {
      return NextResponse.json({ error: "Your question must be between 1 and 6,000 characters." }, { status: 400 });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI is not configured yet. Add OPENAI_API_KEY in your deployment environment. You can still explore the planner and study tools." }, { status: 503 });
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", temperature: 0.4, max_tokens: 900, messages: [
        { role: "system", content: "You are StudyOS, a patient study tutor. Explain clearly, show steps for problems, encourage active recall, admit uncertainty, and never invent citations or claim to have read a document that was not provided. Keep the answer focused and student-friendly." },
        { role: "user", content: message }
      ] }), signal: AbortSignal.timeout(30000)
    });
    if (!upstream.ok) {
      const status = upstream.status;
      return NextResponse.json({ error: status === 429 ? "The AI service is busy or its quota has been reached. Try again shortly." : "The AI service could not answer right now. Check the server configuration and try again." }, { status: status === 429 ? 429 : 502 });
    }
    const data = await upstream.json();
    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) return NextResponse.json({ error: "The AI returned an empty response. Please try again." }, { status: 502 });
    return NextResponse.json({ answer: answer.trim() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to process this request. Please try again." }, { status: 400 });
  }
}
