import Link from "next/link";
import { requireMaster } from "@/lib/data";
import { SiteHeader } from "@/components/SiteHeader";
import { PageTitle } from "@/components/ui";
import { NotesManager } from "@/components/NotesManager";
import type { Note } from "@/lib/types";

export const metadata = { title: "Enredo" };

/** Enredo: anotações privadas do Mestre, independentes de campanha. */
export default async function Enredo() {
  const { sb, user } = await requireMaster();
  const { data } = await sb.from("plot_notes").select("*").order("updated_at", { ascending: false });
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="mb-2 text-sm"><Link href="/painel">← Meu painel</Link></p>
        <PageTitle sub="Anotações privadas do Mestre sobre o enredo do mundo. Não pertencem a nenhuma campanha: só você vê.">Enredo</PageTitle>
        <NotesManager userId={user.id} notes={(data ?? []) as Note[]} />
      </main>
    </>
  );
}
