"use client";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/pagamentos", label: "Pagamentos" },
  { href: "/admin/atividade", label: "Atividade" },
  { href: "/admin/admins", label: "Admins" },
  { href: "/admin/catalogo", label: "Catálogo" },
];

export function AdminNav({ isOwner }: { isOwner: boolean }) {
  const path = usePathname();
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-line pb-3">
      <span className="pill mr-2 bg-lime text-black">★ Admin</span>
      {items.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={clsx("rounded-lg px-3 py-1.5 text-sm font-semibold", active ? "bg-bg-3 text-fg" : "text-fg-2 hover:text-fg")}>{i.label}</Link>
        );
      })}
      {isOwner ? <span className="ml-auto text-xs text-fg-3">conta dona</span> : null}
    </div>
  );
}
