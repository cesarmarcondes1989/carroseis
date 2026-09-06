import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/ui";

export const metadata = { title: "Criar conta" };

export default function Cadastro() {
  return (
    <main className="glow flex min-h-screen flex-col items-center justify-center gap-8 p-5">
      <Logo className="text-2xl" />
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
