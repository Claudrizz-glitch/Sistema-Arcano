import Link from "next/link";
import { requireMaster } from "@/lib/data";
import { SiteHeader } from "@/components/SiteHeader";

/** Gerenciar sistema: conteúdo oficial, válido para todas as campanhas e visível no site público. */
export default async function SistemaLayout({ children }: { children: React.ReactNode }) {
  await requireMaster();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="mb-2 flex flex-wrap gap-3 text-sm"><Link href="/painel">← Meu painel</Link><Link href="/painel/sistema">Gerenciar sistema</Link></p>
        {children}
      </main>
    </>
  );
}
