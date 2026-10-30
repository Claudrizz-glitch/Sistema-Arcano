import Link from "next/link";
import { campaignContext } from "@/lib/data";
import { SiteHeader } from "@/components/SiteHeader";
import { CampaignNav } from "@/components/CampaignNav";
import { RealtimeRefresh } from "@/components/client";
import { dateLabel, eclipseLabel, fictionalDate } from "@/lib/format";

const TABLES = ["campaigns", "characters", "encounters", "encounter_participants", "character_spells", "character_blessings", "character_items", "character_contracts", "character_modifiers"];
export default async function CampaignLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { campaign, role } = await campaignContext(id);
  const gm = role === "mestre";
  const fd = fictionalDate(campaign.current_turn, campaign.turn_seconds, campaign.calendar_config);
  const links = gm
    ? [["", "Visão geral"], ["/fichas", "Fichas"], ["/combate", "Combate"], ["/tempo", "Tempo"], ["/sistema", "Gerenciar sistema"], ["/notas", "Anotações"]]
    : [["", "Visão geral"], ["/fichas", "Minhas fichas"]];
  return (
    <>
      <SiteHeader />
      <div className="border-b border-ink-700 bg-ink-900/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div>
            <Link href="/painel" className="text-xs">← Meu painel</Link>
            <h1 className="text-xl">{campaign.name} <span className="badge ml-2 border-gold-600/50 align-middle text-xs">{gm ? "Mestre" : "Jogador"}</span></h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-parch-300">
            <span title={`Turno ${campaign.current_turn} (1 turno = ${campaign.turn_seconds} s)`}><b className="text-gold-300">{dateLabel(fd)}</b> · {fd.time} · turno {campaign.current_turn}<span className="ml-2 text-xs text-parch-500">{eclipseLabel(fd)}</span></span>
            <RealtimeRefresh tables={TABLES} filter={`id=eq.${id}`} />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2"><CampaignNav base={`/campanha/${id}`} links={links as [string, string][]} /></div>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
