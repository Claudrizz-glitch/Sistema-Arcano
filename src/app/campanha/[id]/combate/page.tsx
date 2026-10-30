import { campaignContext } from "@/lib/data";
import { Card, Empty } from "@/components/ui";
import { CreateEncounterForm, EncounterBoard } from "@/components/CombatTime";
import type { Encounter, Participant, Sheet } from "@/lib/types";

export default async function Combate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, role } = await campaignContext(id);
  const gm = role === "mestre";
  const { data: es } = await sb.from("encounters").select("*").eq("campaign_id", id).order("created_at", { ascending: false }).limit(10);
  const encounters = (es ?? []) as Encounter[];
  const { data: ps } = encounters.length ? await sb.from("encounter_participants").select("*").in("encounter_id", encounters.map((e) => e.id)) : { data: [] };
  const parts = (ps ?? []) as Participant[];
  // Só o Mestre lê as fichas dos participantes (RLS impede jogadores de ver NPCs)
  const { data: sh } = gm ? await sb.from("v_characters").select("*").eq("campaign_id", id) : { data: [] };
  const sheets = (sh ?? []) as Sheet[];
  const active = encounters.filter((e) => e.status === "ativo"); const done = encounters.filter((e) => e.status === "encerrado");
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {active.length === 0 ? <Card title="Combate"><Empty>{gm ? "Nenhum encontro em andamento. Inicie um ao lado." : "Nenhum encontro em andamento."}</Empty></Card>
          : active.map((e) => <Card key={e.id} title={e.name}><EncounterBoard encounter={e} gm={gm} parts={parts.filter((p) => p.encounter_id === e.id).map((p) => ({ ...p, sheet: sheets.find((s) => s.id === p.character_id) }))} /></Card>)}
        {done.length > 0 && <Card title="Encontros encerrados"><ul className="text-sm text-parch-300">{done.map((e) => <li key={e.id}>{e.name} — {e.round} rodada(s)</li>)}</ul></Card>}
      </div>
      {gm && <Card title="Novo encontro"><CreateEncounterForm campaignId={id} sheets={sheets.filter((s) => s.status !== "morta")} /></Card>}
    </div>
  );
}
