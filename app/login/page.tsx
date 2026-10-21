"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, LoaderCircle, Mail, LockKeyhole, Sparkles } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [queryError, setQueryError] = useState("");
  const configured = isSupabaseConfigured();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("error");
    if (value) setQueryError(value);
  }, []);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!configured) {
      setError("Connect a Supabase project first. Add the project URL and publishable key to your environment.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
        });
        if (authError) throw authError;
        if (!data.session) {
          setNotice("Account request received. Check your email for a confirmation link, then come back here to sign in.");
        } else {
          router.replace("/");
          router.refresh();
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        router.replace("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to authenticate. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to StudyOS</Link>
        <div className="auth-brand"><div className="brand-mark"><GraduationCap size={23} /></div><div className="brand-word">study<span>os</span><small>YOUR STUDY SPACE</small></div></div>
        <div className="auth-intro"><span className="auth-kicker"><Sparkles size={13} /> YOUR NEXT BREAKTHROUGH STARTS HERE</span><h1>{mode === "signin" ? "Welcome back." : "Your study space awaits."}</h1><p>{mode === "signin" ? "Sign in to keep your learning moving forward." : "Create an account to start saving your study journey."}</p></div>

        {queryError && <div className="auth-alert error">{queryError === "auth-not-configured" ? "Supabase isn't configured for this deployment yet." : "That sign-in link could not be verified. Please try again."}</div>}
        {!configured && <div className="auth-alert info"><b>Cloud accounts aren't connected yet.</b><p>Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to your local or Vercel environment, and apply the included SQL migration. The dashboard can still be explored without an account.</p></div>}
        {error && <div className="auth-alert error" role="alert">{error}</div>}
        {notice && <div className="auth-alert success" role="status">{notice}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <div className="auth-field"><Mail size={17} /><input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} /></div>
          <label htmlFor="password">Password</label>
          <div className="auth-field"><LockKeyhole size={17} /><input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={128} required /></div>
          <button className="auth-submit" type="submit" disabled={!configured || busy}>{busy ? <><LoaderCircle size={17} className="auth-spinner" /> Please wait…</> : mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
        <div className="auth-switch">{mode === "signin" ? "New to StudyOS?" : "Already have an account?"} <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setNotice(""); }}>{mode === "signin" ? "Create an account" : "Sign in"}</button></div>
        <p className="auth-privacy">Your account data is protected by Supabase authentication and per-user database policies once configured.</p>
      </section>
    </main>
  );
}
