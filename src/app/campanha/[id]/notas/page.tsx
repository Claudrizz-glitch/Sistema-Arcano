import { requireGm } from "@/lib/data";
import { NotesManager } from "@/components/NotesManager";
import type { Note } from "@/lib/types";

export const metadata = { title: "Anotações privadas" };
export default async function Notas({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, user } = await requireGm(id);
  const { data } = await sb.from("master_notes").select("*").eq("campaign_id", id).order("updated_at", { ascending: false });
  return <NotesManager campaignId={id} userId={user.id} notes={(data ?? []) as Note[]} />;
}
