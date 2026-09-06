"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/client";
import type { Profile } from "@/lib/types";
import { Alert, Field, Spinner } from "./ui";

export function Account({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const router = useRouter();
  const [name, setName] = useState(profile.full_name ?? "");
  const [handle, setHandle] = useState(profile.instagram_handle ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ full_name: name, instagram_handle: handle.replace(/^@/, "") || null }).eq("id", profile.id);
    if (!error && password) {
      const { error: e2 } = await supabase.auth.updateUser({ password });
      if (e2) setMsg({ kind: "error", text: e2.message });
    }
    if (error) setMsg({ kind: "error", text: error.message });
    else if (!msg) setMsg({ kind: "ok", text: t.studio.saved });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold">{t.app.account}</h1>
      <div className="card mt-6 space-y-4 p-5">
        <div className="text-sm text-fg-2">{profile.email} · <span className="pill bg-bg-3 text-fg-2">{profile.role}</span></div>
        <Field label={t.auth.name}><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={t.create.handle}><input className="input" value={handle} onChange={(e) => setHandle(e.target.value)} /></Field>
        <Field label={`${t.auth.password} (nova)`}><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} /></Field>
        {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}
        <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? <Spinner /> : t.studio.save}</button>
      </div>
    </div>
  );
}
