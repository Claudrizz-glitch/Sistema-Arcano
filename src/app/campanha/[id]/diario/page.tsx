import Link from "next/link";
import { campaignContext } from "@/lib/data";
import { Card } from "@/components/ui";
import { DayNoteEditor } from "@/components/DayNoteEditor";
import { campaignDays, configFromJson } from "@/domain/calendar";
import type { DayNote } from "@/lib/types";

export const metadata = { title: "Diário" };

/** Um campo por dia da campanha: público (jogadores e Mestre editam) e privado (só o Mestre). */
export default async function Diario({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ d?: string }> }) {
  const { id } = await params; const { d } = await searchParams;
  const { sb, campaign, role } = await campaignContext(id);
  const gm = role === "mestre";
  const cfg = configFromJson(campaign.calendar_config as Record<string, any>);
  const days = campaignDays(campaign.current_turn, campaign.turn_seconds, cfg);
  const today = days[days.length - 1];
  const sel = days.find((x) => String(x.abs) === d) ?? today;
  const { data } = await sb.from("day_notes").select("*").eq("campaign_id", id);
  const notes = (data ?? []) as DayNote[];
  const noteOf = (abs: number, vis: "publica" | "privada") => {
    const r = days.find((x) => x.abs === abs)!;
    return notes.find((n) => n.year === r.year && n.season_index === r.seasonIndex && n.day === r.day && n.visibility === vis) ?? null;
  };
  const pub = noteOf(sel.abs, "publica"); const priv = gm ? noteOf(sel.abs, "privada") : null;
  const label = (x: typeof sel) => `${x.day} de ${x.season}${x.year !== 1 ? ` · Ano ${x.year}` : ""}`;

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <nav aria-label="Dias da campanha" className="card space-y-1 lg:col-span-1">
        <h2 className="card-title">Dias</h2>
        <ul className="space-y-1 text-sm">{[...days].reverse().map((x) => {
          const has = !!noteOf(x.abs, "publica")?.content || (gm && !!noteOf(x.abs, "privada")?.content);
          return <li key={x.abs}><Link href={`/campanha/${id}/diario?d=${x.abs}`} aria-current={x.abs === sel.abs ? "page" : undefined}
            className={`block rounded-md px-2 py-1 no-underline ${x.abs === sel.abs ? "bg-gold-600/30 text-gold-300" : "text-parch-300 hover:bg-ink-700"}`}>
            {label(x)}{x.abs === today.abs ? " · hoje" : ""}{has ? " ✎" : ""}</Link></li>;
        })}</ul>
      </nav>
      <div className="space-y-4 lg:col-span-3">
        <h2 className="text-2xl">{label(sel)}</h2>
        <Card title="Anotações do grupo (públicas)">
          <DayNoteEditor campaignId={id} year={sel.year} seasonIndex={sel.seasonIndex} day={sel.day} visibility="publica" note={pub}
            hint="Todos os jogadores e o Mestre podem ler e editar." />
        </Card>
        {gm && (
          <Card title="Roteiro do Mestre (privado)">
            <DayNoteEditor campaignId={id} year={sel.year} seasonIndex={sel.seasonIndex} day={sel.day} visibility="privada" note={priv}
              hint="Só você vê. Para imagens, use uma linha própria: ![legenda](/img/…)." />
          </Card>)}
        {!pub?.content && !gm && <p className="text-sm text-parch-500">Ninguém escreveu neste dia ainda.</p>}
      </div>
    </div>
  );
}
