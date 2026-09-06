import Link from "next/link";
import { redirect } from "next/navigation";
import { getDict } from "@/lib/i18n/server";
import { getSession } from "@/lib/supabase/server";
import { listTemplatesFor } from "@/lib/templates/custom";
import { pickTemplate } from "@/lib/templates/registry";
import { resolveStyle } from "@/lib/render/Slide";
import { SlidePreview } from "@/components/SlidePreview";
import type { Carousel } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Projects() {
  const { t } = await getDict();
  const { supabase, profile } = await getSession();
  if (!profile) redirect("/login?next=/app");
  if (!profile.onboarded_at) redirect("/app/comecar");
  const [{ data }, templates] = await Promise.all([supabase.from("carousels").select("*").order("created_at", { ascending: false }).limit(60), listTemplatesFor(profile.id)]);
  const carousels = (data as Carousel[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{t.app.projects}</h1>
        <Link href="/app/novo" className="btn btn-primary">＋ {t.app.newCarousel}</Link>
      </div>
      {carousels.length === 0 ? (
        <div className="card mt-10 flex flex-col items-center gap-4 p-14 text-center">
          <div className="text-5xl">🎠</div>
          <p className="text-fg-2">{t.app.empty}</p>
          <Link href="/app/novo" className="btn btn-primary">{t.app.newCarousel}</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {carousels.map((c) => {
            const tpl = pickTemplate(templates, c);
            const style = resolveStyle(tpl, c.brand_overrides, c.instagram_handle);
            const first = c.slides?.[0] ?? { titulo: c.title };
            return (
              <Link key={c.id} href={`/app/c/${c.id}`} className="group">
                <div className="overflow-hidden rounded-2xl border border-line transition group-hover:border-lime/60">
                  {c.renders?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.renders[0].url} alt="" className="aspect-[4/5] w-full object-cover" />
                  ) : (
                    <SlidePreview template={tpl} slide={first} index={0} total={c.slides?.length || 1} aspect={c.aspect} style={style} authorName={profile?.full_name} />
                  )}
                </div>
                <div className="mt-2 px-1">
                  <div className="truncate text-sm font-bold">{c.title}</div>
                  <div className="flex items-center justify-between text-xs text-fg-3">
                    <span>{tpl.name}</span>
                    <span className={c.status === "ready" ? "text-ok" : c.status === "error" ? "text-danger" : ""}>{t.app.status[c.status]}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
