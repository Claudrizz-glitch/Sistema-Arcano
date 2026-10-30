import { campaignContext } from "@/lib/data";
import { Card, Empty, Bar, StatusBadge } from "@/components/ui";
import { SettingsForm } from "@/components/CampaignForms";
import { dateLabel, eclipseLabel, fictionalDate } from "@/lib/format";
import Link from "next/link";
import type { Member, Sheet } from "@/lib/types";

export default async function Visao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, campaign, role, user } = await campaignContext(id);
  const gm = role === "mestre";
  const { data: ms } = await sb.from("campaign_members").select("*").eq("campaign_id", id);
  const members = (ms ?? []) as Member[];
  const { data: profs } = await sb.from("profiles").select("id,display_name").in("id", members.map((m) => m.user_id));
  const names = new Map((profs ?? []).map((p: { id: string; display_name: string }) => [p.id, p.display_name]));
  const { data: sh } = await sb.from("v_characters").select("*").eq("campaign_id", id).order("name");
  const sheets = (sh ?? []) as Sheet[];
  const active = sheets.filter((s) => s.status === "ativa");
  const pend = sheets.filter((s) => s.status === "pendente" && s.kind === "jogador");
  const { data: gaps } = gm ? await sb.from("rule_gaps").select("*").is("campaign_id", null).eq("status", "aberta") : { data: [] };
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card title="Estado da campanha">
          <p className="text-sm text-parch-300">{campaign.description || "Sem descrição."}</p>
          {(() => { const fd = fictionalDate(campaign.current_turn, campaign.turn_seconds, campaign.calendar_config); return (<>
            <p className="mt-3 text-sm">Data de Arkhavel: <b className="text-gold-300">{dateLabel(fd)}</b> · {fd.time}</p>
            <p className="mt-1 text-sm text-parch-300">{eclipseLabel(fd)} · turno {campaign.current_turn} (1 turno = {campaign.turn_seconds} s)</p></>); })()}
        </Card>
        {gm && pend.length > 0 && (
          <Card title={`Fichas aguardando aprovação (${pend.length})`}>
            <ul className="space-y-1">{pend.map((s) => <li key={s.id}><Link href={`/campanha/${id}/fichas/${s.id}`}>{s.name}</Link> <span className="text-xs text-parch-500">— {names.get(s.owner_id ?? "") ?? "jogador"}</span></li>)}</ul>
          </Card>
        )}
        <Card title={gm ? "Personagens em jogo" : "Meus personagens ativos"}>
          {active.length === 0 ? <Empty>Nenhum personagem ativo no momento.</Empty> : (
            <ul className="grid gap-3 sm:grid-cols-2">{active.map((s) => (
              <li key={s.id} className="rounded-md border border-ink-600 p-3">
                <Link href={`/campanha/${id}/fichas/${s.id}`} className="font-display text-lg no-underline">{s.name}</Link>
                <p className="mb-2 text-xs text-parch-500">Nível {s.level} · {s.race_slug}{s.kind === "mestre" ? " · NPC (privado)" : ""}</p>
                <div className="space-y-2"><Bar label="Vida" current={s.hp_current} max={s.max_hp} tone="hp" /><Bar label="Mana" current={s.mana_current} max={s.max_mana} tone="mana" /></div>
              </li>))}</ul>)}
        </Card>
        {gm && gaps && gaps.length > 0 && (
          <Card title={`Regras incompletas (${gaps.length})`}>
            <p className="mb-2 text-xs text-parch-500">Lacunas do documento oficial — nenhum valor foi inventado para elas.</p>
            <ul className="space-y-2 text-sm">{gaps.map((g: { id: string; topic: string; description: string }) => <li key={g.id}><b className="text-gold-300">{g.topic}.</b> {g.description}</li>)}</ul>
          </Card>
        )}
      </div>
      <div className="space-y-4">
        {gm && <Card title="Convite"><p className="text-sm text-parch-300">Envie este código aos jogadores:</p><p className="mt-2 select-all rounded bg-ink-900 p-2 text-center font-mono text-lg tracking-widest text-gold-300">{campaign.invite_code}</p></Card>}
        <Card title={`Membros (${members.length})`}>
          <ul className="space-y-1 text-sm">{members.map((m) => <li key={m.user_id} className="flex justify-between"><span>{names.get(m.user_id) ?? "—"}{m.user_id === user.id ? " (você)" : ""}</span><span className="badge border-ink-600">{m.role === "mestre" ? "Mestre" : "Jogador"}</span></li>)}</ul>
        </Card>
        {gm && <Card title="Configurações"><SettingsForm campaign={campaign} /></Card>}
      </div>
    </div>
  );
}
