import Link from "next/link";
import { campaignContext } from "@/lib/data";
import { Card, Empty, StatusBadge, Bar } from "@/components/ui";
import { CreateNpcForm, CreateSheetForm } from "@/components/CampaignForms";
import type { Race, Sheet, Variant } from "@/lib/types";

export default async function Fichas({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ s?: string; k?: string }> }) {
  const { id } = await params; const { s, k } = await searchParams;
  const { sb, campaign, role, user } = await campaignContext(id);
  const gm = role === "mestre";
  const [{ data: sh }, { data: rs }, { data: vs }] = await Promise.all([
    sb.from("v_characters").select("*").eq("campaign_id", id).order("name"),
    sb.from("races").select("*").order("name"), sb.from("race_variants").select("*").order("name"),
  ]);
  const all = (sh ?? []) as Sheet[];
  const selectable = ((rs ?? []) as Race[]).filter((r) => r.slug !== "druida_puro");
  let list = all;
  if (s) list = list.filter((x) => x.status === s);
  if (k) list = list.filter((x) => x.kind === k);
  const mine = all.filter((x) => x.owner_id === user.id);
  const order = { pendente: 0, ativa: 1, inativa: 2, morta: 3 } as const;
  list = [...list].sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {gm && (
          <p className="flex flex-wrap gap-2 text-sm">
            {[["", "Todas"], ["pendente", "Pendentes"], ["ativa", "Ativas"], ["inativa", "Inativas"], ["morta", "Mortas"]].map(([v, l]) => (
              <Link key={v} href={`/campanha/${id}/fichas${v ? `?s=${v}` : ""}`} className={`badge no-underline ${(s ?? "") === v ? "border-gold-400" : "border-ink-600"}`}>{l}</Link>))}
            <Link href={`/campanha/${id}/fichas?k=mestre`} className={`badge no-underline ${k === "mestre" ? "border-gold-400" : "border-ink-600"}`}>Só NPCs</Link>
          </p>
        )}
        {list.length === 0 ? <Empty>{gm ? "Nenhuma ficha encontrada. Crie um NPC ao lado ou aguarde os jogadores criarem fichas." : "Você ainda não tem fichas. Crie a primeira ao lado — o Mestre a revisará e ativará."}</Empty> : (
          <ul className="grid gap-3 sm:grid-cols-2">{list.map((x) => (
            <li key={x.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/campanha/${id}/fichas/${x.id}`} className="font-display text-lg no-underline">{x.name}</Link>
                <StatusBadge status={x.status} />
              </div>
              <p className="mb-2 text-xs text-parch-500">Nível {x.level} · {x.race_slug}{x.variant_slug ? ` (${x.variant_slug})` : ""}{x.kind === "mestre" ? " · NPC privado" : ""}</p>
              <div className="space-y-2"><Bar label="Vida" current={x.hp_current} max={x.max_hp} tone="hp" /><Bar label="Mana" current={x.mana_current} max={x.max_mana} tone="mana" /></div>
              {x.status === "pendente" && !gm && <p className="mt-2 text-xs text-amber-300">Aguardando revisão do Mestre antes de poder ser usada.</p>}
            </li>))}</ul>)}
      </div>
      <div>
        {gm ? <Card title="Novo NPC / criatura (privado)"><CreateNpcForm campaignId={id} races={selectable} variants={(vs ?? []) as Variant[]} /></Card>
          : <Card title="Nova ficha"><CreateSheetForm campaignId={id} races={selectable.filter((r) => r.slug !== "druida_puro")} variants={(vs ?? []) as Variant[]} limit={campaign.max_sheets_per_player} used={mine.length} /></Card>}
      </div>
    </div>
  );
}
