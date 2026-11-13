import { campaignContext } from "@/lib/data";
import { Card, Empty } from "@/components/ui";
import { CreateEncounterForm, EncounterBoard, TimePanel } from "@/components/CombatTime";
import { dateLabel, eclipseLabel, fictionalDate } from "@/lib/format";
import type { Encounter, LogRow, Participant, Sheet } from "@/lib/types";

export const metadata = { title: "Turnos" };

/** Turnos: tempo da campanha (turnos, horas e dias) e os encontros de combate na mesma tela. */
export default async function Turnos({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, role, campaign, sessionStart, sessionTurn, sessionNumber } = await campaignContext(id);
  const gm = role === "mestre";
  const { data: es } = await sb.from("encounters").select("*").eq("campaign_id", id).order("created_at", { ascending: false }).limit(10);
  const encounters = (es ?? []) as Encounter[];
  const { data: ps } = encounters.length ? await sb.from("encounter_participants").select("*").in("encounter_id", encounters.map((e) => e.id)) : { data: [] };
  const parts = (ps ?? []) as Participant[];
  // Só o Mestre lê as fichas dos participantes (o RLS impede jogadores de ver NPCs)
  const { data: sh } = gm ? await sb.from("v_characters").select("*").eq("campaign_id", id) : { data: [] };
  const sheets = (sh ?? []) as Sheet[];
  const { data: lg } = gm ? await sb.from("action_log").select("*").eq("campaign_id", id).in("action", ["avancar_turno", "avancar_tempo"]).order("created_at", { ascending: false }).limit(20) : { data: [] };
  const log = (lg ?? []) as LogRow[];
  const active = encounters.filter((e) => e.status === "ativo"); const done = encounters.filter((e) => e.status === "encerrado");
  const fd = fictionalDate(campaign.current_turn, campaign.turn_seconds, campaign.calendar_config);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {gm && <Card title="Passar o tempo"><TimePanel campaignId={id} turn={campaign.current_turn} turnSeconds={campaign.turn_seconds} sessionStart={sessionStart} sessionNumber={sessionNumber} /></Card>}
        {active.length === 0 ? <Card title="Combate"><Empty>{gm ? "Nenhum encontro em andamento. Inicie um ao lado." : "Nenhum encontro em andamento."}</Empty></Card>
          : active.map((e) => <Card key={e.id} title={`Combate — ${e.name}`}><EncounterBoard encounter={e} gm={gm} parts={parts.filter((p) => p.encounter_id === e.id).map((p) => ({ ...p, sheet: sheets.find((s) => s.id === p.character_id) }))} /></Card>)}
        {gm && log.length > 0 && (
          <Card title="Histórico do tempo">
            <ul className="divide-y divide-ink-700 text-sm">{log.map((l) => { const r = l.result as { from_turn: number; to_turn: number; regen: { name: string; hp: number[]; mana: number[] }[]; mode?: string };
              return <li key={l.id} className="py-2"><b className="text-gold-300">+{r.to_turn - r.from_turn} turno(s)</b>{r.mode === "tempo" && <span className="badge ml-2 border-ink-600">passagem de tempo</span>} <span className="text-xs text-parch-500">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                <p className="text-parch-300">{r.regen.length === 0 ? "Sem alterações de recursos." : r.regen.map((x) => `${x.name} (${x.hp[0] !== x.hp[1] ? `Vida ${x.hp[0]}→${x.hp[1]}` : ""}${x.mana[0] !== x.mana[1] ? ` Mana ${x.mana[0]}→${x.mana[1]}` : ""})`).join("; ")}</p></li>; })}</ul>
          </Card>)}
        {done.length > 0 && <Card title="Encontros encerrados"><ul className="text-sm text-parch-300">{done.map((e) => <li key={e.id}>{e.name} — {e.round} rodada(s)</li>)}</ul></Card>}
      </div>
      <div className="space-y-4">
        <Card title="Calendário">
          <p className="text-2xl text-gold-300">{dateLabel(fd)}</p>
          <p className="text-sm text-parch-300">{fd.time} · turno {sessionTurn}{sessionNumber ? ` da sessão ${sessionNumber}` : ""}</p>
          <p className="mt-1 text-sm text-parch-300">{eclipseLabel(fd)}</p>
          <p className="mt-2 text-xs text-parch-500">1 turno = {campaign.turn_seconds} s · 1 hora = {3600 / campaign.turn_seconds} turnos · 1 dia = {86400 / campaign.turn_seconds} turnos. O contador de turnos recomeça a cada sessão; o calendário continua de onde parou. Estações de 90 dias; o Grande Eclipse acontece no 1º dia da Primavera, a cada 22 anos.</p>
        </Card>
        {gm && <Card title="Novo encontro"><CreateEncounterForm campaignId={id} sheets={sheets.filter((s) => s.status !== "morta")} /></Card>}
      </div>
    </div>
  );
}
