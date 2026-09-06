"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Carousel } from "@/lib/types";
import { Alert, Spinner } from "./ui";

let shareProbe: boolean | null = null;
const subscribeNoop = () => () => {};
function detectFileShare() {
  if (shareProbe !== null) return shareProbe;
  try {
    const probe = new File([new Uint8Array([137, 80, 78, 71])], "x.png", { type: "image/png" });
    shareProbe = !!navigator.canShare && navigator.canShare({ files: [probe] });
  } catch {
    shareProbe = false;
  }
  return shareProbe;
}

/**
 * Download pensado pro celular: a Web Share API abre a folha nativa do iPhone e
 * do Android com as imagens, onde a pessoa toca em "Salvar imagens" ou manda
 * direto pro Instagram. Sem ZIP. No desktop, download por card ou ZIP.
 */
export function DownloadPanel({ carousel, canDownload }: { carousel: Carousel; canDownload: boolean }) {
  const { t } = useI18n();
  const d = t.download;
  const canShare = useSyncExternalStore(subscribeNoop, detectFileShare, () => false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error" | "info"; text: string } | null>(null);
  const renders = [...(carousel.renders ?? [])].sort((a, b) => a.index - b.index);
  // "no-store" no servidor não apaga cache que o navegador já guardou de uma visita anterior a
  // este deploy, e /slide/N é a mesma URL a cada regeração. Por isso a versão de cada render
  // (o timestamp que já vai no caminho do Storage) entra na querystring: a URL muda sozinha
  // sempre que a imagem muda, e nenhuma camada de cache (navegador, proxy, o que for) consegue
  // devolver uma resposta velha pra uma URL nova.
  const versionOf = (i: number) => carousel.renders?.find((r) => r.index === i)?.path.match(/\/(\d+)\/slide-/)?.[1] ?? "0";
  const slideUrl = (i: number) => `/api/carousels/${carousel.id}/slide/${i + 1}?v=${versionOf(i)}`;
  const fileName = (i: number) => `${carousel.title.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase() || "carrossel"}-${String(i + 1).padStart(2, "0")}.png`;

  /** Uma nova tentativa em erro de rede/servidor: numa série de vários cards, um único
   * pedido instável não pode derrubar o "Salvar" inteiro e obrigar a pessoa a clicar de novo. */
  async function fetchSlide(i: number): Promise<Blob> {
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(slideUrl(i), { cache: "no-store" }).catch(() => null);
      if (res?.status === 402) throw new Error("PLAN_REQUIRED");
      if (res?.ok) return res.blob();
      if (attempt >= 2) throw new Error(t.common.error);
    }
  }

  async function fetchFiles(indexes: number[]) {
    const blobs = await Promise.all(indexes.map((i) => fetchSlide(i)));
    const files = indexes.map((i, k) => new File([blobs[k]], fileName(i), { type: "image/png" }));
    return files;
  }

  async function share(indexes: number[]) {
    const key = indexes.length === 1 ? `s${indexes[0]}` : "all";
    setBusy(key);
    setMsg(null);
    try {
      const files = await fetchFiles(indexes);
      if (!navigator.canShare?.({ files })) throw new Error("NO_SHARE");
      await navigator.share({ files, title: carousel.title, text: carousel.caption ?? undefined });
      setMsg({ kind: "ok", text: d.shared });
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (m === "PLAN_REQUIRED") setMsg({ kind: "error", text: t.studio.downloadLocked });
      else if (e instanceof DOMException && e.name === "AbortError") setMsg(null);
      else if (m === "NO_SHARE") setMsg({ kind: "info", text: d.noShare });
      else setMsg({ kind: "error", text: t.common.error });
    } finally {
      setBusy(null);
    }
  }

  if (!renders.length) return null;
  if (!canDownload) {
    return (
      <div className="card mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div><div className="font-bold">{d.title}</div><div className="text-sm text-fg-2">{d.locked}</div></div>
        <Link href="/app/creditos" className="btn btn-primary">🔒 {t.studio.downloadLocked}</Link>
      </div>
    );
  }

  return (
    <div className="card mt-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="font-bold">{d.title}</div><div className="text-sm text-fg-2">{canShare ? d.hintShare : d.hintDesktop}</div></div>
        <div className="flex flex-wrap gap-2">
          {canShare ? (
            <button onClick={() => share(renders.map((r) => r.index))} disabled={!!busy} className="btn btn-primary">{busy === "all" ? <><Spinner /> {d.preparing}</> : `📲 ${d.saveAll}`}</button>
          ) : null}
          <a href={`/api/carousels/${carousel.id}/download`} className={`btn ${canShare ? "btn-ghost btn-sm" : "btn-primary"}`}>⬇ {d.zip}</a>
        </div>
      </div>
      {msg ? <div className="mt-3"><Alert kind={msg.kind}>{msg.text}</Alert></div> : null}
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
        {renders.map((r) => (
          <div key={r.index} className="group">
            <a href={`${slideUrl(r.index)}&inline=1`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.url} alt={`Card ${r.index + 1}`} className="aspect-[4/5] w-full object-cover" loading="lazy" />
            </a>
            <div className="mt-1.5 flex items-center justify-between gap-1">
              <span className="text-xs text-fg-3">{r.index + 1}</span>
              {canShare ? (
                <button onClick={() => share([r.index])} disabled={!!busy} className="btn btn-ghost btn-sm !px-2 !py-1 text-xs">{busy === `s${r.index}` ? <Spinner className="h-3 w-3" /> : d.save}</button>
              ) : (
                <a href={slideUrl(r.index)} download={fileName(r.index)} className="btn btn-ghost btn-sm !px-2 !py-1 text-xs">⬇ {d.save}</a>
              )}
            </div>
          </div>
        ))}
      </div>
      {canShare ? <p className="mt-3 text-xs text-fg-3">{d.tipInstagram}</p> : null}
    </div>
  );
}
