import { requireGm } from "@/lib/data";
import { Card, Empty } from "@/components/ui";
import { TimePanel } from "@/components/CombatTime";
import { dateLabel, eclipseLabel, fictionalDate } from "@/lib/format";
import type { LogRow } from "@/lib/types";

export default async function Tempo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, campaign } = await requireGm(id);
  const { data } = await sb.from("action_log").select("*").eq("campaign_id", id).eq("action", "avancar_turno").order("created_at", { ascending: false }).limit(30);
  const log = (data ?? []) as LogRow[];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Controle de turnos"><TimePanel campaignId={id} turn={campaign.current_turn} turnSeconds={campaign.turn_seconds} /></Card>
      <Card title="Calendário da campanha">
        {(() => { const fd = fictionalDate(campaign.current_turn, campaign.turn_seconds, campaign.calendar_config); return (<>
          <p className="text-2xl text-gold-300">{dateLabel(fd)}</p>
          <p className="text-sm text-parch-300">{fd.time} · {eclipseLabel(fd)}</p>
          <p className="mt-2 text-xs text-parch-500">4 estações de 90 dias (360 dias por ano). A campanha começou no dia 68 do Inverno. Grande Eclipse a cada 22 anos, no 1º dia da primavera. O dia 68 de 90 deixa 22 dias até o fim do inverno; o 1º dia da primavera é o 23º dia a partir dali.</p></>); })()}
        <p className="mt-2 text-sm text-parch-300">Regeneração: {campaign.regen_hp} PV e {campaign.regen_mana} Mana a cada {campaign.regen_interval_turns} turno(s) — ajustável em Visão geral → Configurações.</p>
      </Card>
      <Card title="Histórico de avanços" className="lg:col-span-2">
        {log.length === 0 ? <Empty>Nenhum avanço de turno registrado.</Empty> : (
          <ul className="divide-y divide-ink-700 text-sm">{log.map((l) => { const r = l.result as { from_turn: number; to_turn: number; regen: { name: string; hp: number[]; mana: number[] }[] };
            return <li key={l.id} className="py-2"><b className="text-gold-300">Turno {r.from_turn} → {r.to_turn}</b> <span className="text-xs text-parch-500">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
              <p className="text-parch-300">{r.regen.length === 0 ? "Sem alterações de recursos." : r.regen.map((x) => `${x.name} (${x.hp[0] !== x.hp[1] ? `Vida ${x.hp[0]}→${x.hp[1]}` : ""}${x.mana[0] !== x.mana[1] ? ` Mana ${x.mana[0]}→${x.mana[1]}` : ""})`).join("; ")}</p></li>; })}</ul>)}
      </Card>
    </div>
  );
}
