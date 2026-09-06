"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/client";
import { Alert, Field, Spinner } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  async function google() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ kind: "error", text: error.message });
      else {
        router.push(next);
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) setMsg({ kind: "error", text: error.message });
      else if (data.session) {
        router.push("/app");
        router.refresh();
      } else setMsg({ kind: "ok", text: t.auth.checkEmail });
    }
    setBusy(false);
  }

  async function forgot() {
    if (!email) return setMsg({ kind: "error", text: t.auth.email });
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/app/conta` });
    setMsg(error ? { kind: "error", text: error.message } : { kind: "ok", text: t.auth.resetSent });
  }

  return (
    <div className="card w-full max-w-md p-8">
      <h1 className="font-display text-2xl font-bold">{mode === "login" ? t.auth.loginTitle : t.auth.signupTitle}</h1>
      <button onClick={google} className="btn btn-ghost mt-6 w-full">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z"/><path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.1 0 11.6-2 15.4-5.5l-7.5-5.8c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.7-4-13.6-9.7l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>
        {t.auth.google}
      </button>
      <div className="my-5 flex items-center gap-3 text-xs text-fg-3"><span className="h-px flex-1 bg-line" />{t.auth.or}<span className="h-px flex-1 bg-line" /></div>
      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" ? (
          <Field label={t.auth.name}><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        ) : null}
        <Field label={t.auth.email}><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label={t.auth.password}><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></Field>
        {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? <Spinner /> : mode === "login" ? t.auth.login : t.auth.signup}</button>
      </form>
      <div className="mt-5 flex items-center justify-between text-sm text-fg-2">
        {mode === "login" ? (
          <>
            <button onClick={forgot} className="hover:text-fg">{t.auth.forgot}</button>
            <span>{t.auth.noAccount} <Link href="/cadastro" className="font-bold text-lime">{t.nav.signup}</Link></span>
          </>
        ) : (
          <span>{t.auth.hasAccount} <Link href="/login" className="font-bold text-lime">{t.auth.login}</Link></span>
        )}
      </div>
    </div>
  );
}
