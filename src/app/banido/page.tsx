import { Logo } from "@/components/ui";
import { getSession } from "@/lib/supabase/server";

export default async function Banido() {
  const { profile } = await getSession();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-5 text-center">
      <Logo className="text-2xl" />
      <div className="card max-w-md p-8">
        <h1 className="font-display text-2xl font-bold">Conta suspensa</h1>
        <p className="mt-3 text-fg-2">Esta conta foi suspensa pela equipe do CarrosseisIA.{profile?.banned_reason ? ` Motivo: ${profile.banned_reason}.` : ""}</p>
        <p className="mt-2 text-sm text-fg-3">Se acha que foi um engano, fale com o suporte.</p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button className="btn btn-ghost">Sair</button>
        </form>
      </div>
    </main>
  );
}
