import { redirect } from "next/navigation";

// Combate e Tempo foram unidos na seção Turnos.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/campanha/${id}/turnos`);
}
