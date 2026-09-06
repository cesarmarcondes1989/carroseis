"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { ApiKey } from "@/lib/types";
import { Alert, CopyButton, Spinner } from "./ui";

export function ApiKeys({ keys, appUrl }: { keys: ApiKey[]; appUrl: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [name, setName] = useState("Claude");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ key: string; url: string } | null>(null);

  async function create() {
    setBusy(true);
    const res = await fetch("/api/keys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setCreated({ key: data.key, url: data.url });
      router.refresh();
    }
  }
  async function revoke(id: string) {
    if (!confirm(`${t.keys.revoke}?`)) return;
    await fetch("/api/keys", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  }
  const base = appUrl || (typeof window !== "undefined" ? window.location.origin : "");

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold">{t.keys.title}</h1>
      <p className="mt-1 text-fg-2">{t.keys.subtitle}</p>

      <div className="card mt-6 p-5">
        <div className="flex gap-2">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.keys.name} />
          <button className="btn btn-primary" onClick={create} disabled={busy}>{busy ? <Spinner /> : t.keys.create}</button>
        </div>
        {created ? (
          <div className="mt-4 space-y-3">
            <Alert kind="ok">{t.keys.created}</Alert>
            <div className="rounded-xl bg-black/50 p-3 font-mono text-xs break-all">
              <div className="text-fg-3">MCP URL</div>
              <div className="mt-1 flex items-start justify-between gap-2"><span>{created.url}</span><CopyButton text={created.url} /></div>
              <div className="mt-3 text-fg-3">API key (Authorization: Bearer)</div>
              <div className="mt-1 flex items-start justify-between gap-2"><span>{created.key}</span><CopyButton text={created.key} /></div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card mt-4 divide-y divide-line">
        {keys.length === 0 ? <div className="p-6 text-center text-sm text-fg-3">{t.keys.empty}</div> : null}
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <div>
              <div className="font-bold">{k.name} <span className="font-mono text-xs text-fg-3">{k.key_prefix}…</span></div>
              <div className="text-xs text-fg-3">{k.calls} chamadas{k.last_used_at ? ` · última ${new Date(k.last_used_at).toLocaleString("pt-BR")}` : ""}</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => revoke(k.id)}>{t.keys.revoke}</button>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-5">
        <h2 className="font-bold">{t.keys.howto}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-fg-2">
          {t.keys.steps.map((s) => <li key={s}>{s.replace("<URL>", `${base}/api/mcp/<chave>`)}</li>)}
        </ol>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-black/50 p-3 font-mono text-xs text-fg-2">{`# Claude Code
claude mcp add --transport http carrosseisia ${base}/api/mcp/cia_SUA_CHAVE

# Qualquer cliente MCP (Streamable HTTP)
POST ${base}/api/mcp
Authorization: Bearer cia_SUA_CHAVE`}</pre>
      </div>
    </div>
  );
}
