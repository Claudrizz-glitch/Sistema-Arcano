import { redirect } from "next/navigation";
import { requireGm } from "@/lib/data";
import { PageTitle } from "@/components/ui";
import { ImportTool } from "@/components/ImportTool";

export const metadata = { title: "Importar conteúdo oficial" };
export default async function Importar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await requireGm(id);
  if (!profile.is_master) redirect(`/campanha/${id}/sistema`);
  return (<><PageTitle sub="Texto original extraído do PDF por script, com verificação de integridade (nada foi retipado).">Importar conteúdo oficial</PageTitle><ImportTool userId={user.id} /></>);
}
