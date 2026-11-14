import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./client";

const LINKS = [
  { href: "/regras", label: "Regras" }, { href: "/racas", label: "Raças" }, { href: "/feiticos", label: "Feitiços" },
  { href: "/bencaos", label: "Bênçãos" }, { href: "/itens", label: "Itens" }, { href: "/bestiario", label: "Bestiário" },
];
export async function SiteHeader() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return (
    <header className="border-b border-gold-600/30 bg-ink-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-display text-2xl tracking-widest text-gold-300 no-underline">✦ ARKHAVEL</Link>
        <nav aria-label="Principal" className="flex flex-wrap items-center gap-1">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className="rounded-md px-3 py-1.5 text-sm text-parch-300 no-underline hover:bg-ink-700">{l.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (<><Link className="btn btn-sm no-underline" href="/painel">Meu painel</Link><SignOutButton /></>)
            : (<><Link className="btn btn-sm no-underline" href="/entrar">Entrar</Link><Link className="btn btn-sm btn-primary no-underline" href="/cadastrar">Criar conta</Link></>)}
        </div>
      </div>
    </header>
  );
}
export function SiteFooter() {
  return <footer className="mt-16 border-t border-ink-700 py-6 text-center text-xs text-parch-500">Sistema Arcano · Arkhavel — conteúdo extraído do documento oficial de regras.</footer>;
}
