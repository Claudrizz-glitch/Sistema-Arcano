import Link from "next/link";
import { campaignContext } from "@/lib/data";
import { Card, Empty } from "@/components/ui";
import { NextSession, SessionText } from "@/components/SessionBlocks";

export const metadata = { title: "Diário" };

type Session = { id: string; number: number | null; title: string; date_label: string; public_notes: string; started_at: string | null };
type SessionGm = { session_id: string; script: string; gm_notes: string };

/** Diário por sessão: roteiro da próxima sessão (Mestre) e, em cada sessão iniciada, anotações do grupo e do Mestre. */
export default async function Diario({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ s?: string }> }) {
  const { id } = await params; const { s } = await searchParams;
  const { sb, role } = await campaignContext(id);
  const gm = role === "mestre"; const base = `/campanha/${id}/diario`;
  const { data: ss } = await sb.from("sessions").select("*").eq("campaign_id", id).order("number", { ascending: false });
  const all = (ss ?? []) as Session[];
  const started = all.filter((x) => x.started_at); const draft = all.find((x) => !x.started_at) ?? null;
  const { data: gs } = gm && all.length ? await sb.from("session_gm").select("*").in("session_id", all.map((x) => x.id)) : { data: [] };
  const gmOf = (sid: string) => ((gs ?? []) as SessionGm[]).find((g) => g.session_id === sid);
  const sel = started.find((x) => x.id === s) ?? started[0] ?? null;
  const name = (x: Session) => `Sessão ${x.number}${x.title ? ` — ${x.title}` : ""}`;
  const nextNumber = (started[0]?.number ?? 0) + 1;
  const hint = "Aceita **negrito**, ## títulos, - listas e imagens numa linha própria: ![legenda](/img/…).";

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <nav aria-label="Sessões" className="card space-y-1 lg:col-span-1">
        <h2 className="card-title">Sessões</h2>
        {started.length === 0 ? <p className="text-sm text-parch-500">Nenhuma sessão iniciada.</p> : (
          <ul className="space-y-1 text-sm">{started.map((x) => (
            <li key={x.id}><Link href={`${base}?s=${x.id}`} aria-current={x.id === sel?.id ? "page" : undefined}
              className={`block rounded-md px-2 py-1 no-underline ${x.id === sel?.id ? "bg-gold-600/30 text-gold-300" : "text-parch-300 hover:bg-ink-700"}`}>
              {name(x)}<span className="block text-xs text-parch-500">{x.date_label}</span></Link></li>))}</ul>)}
      </nav>
      <div className="space-y-4 lg:col-span-3">
        {gm && (
          <Card title={`Próxima sessão (${nextNumber})`}>
            <NextSession key={draft?.id ?? "novo"} campaignId={id} base={base} title={draft?.title ?? ""} script={draft ? gmOf(draft.id)?.script ?? "" : ""} nextNumber={nextNumber} />
          </Card>)}
        {!sel ? <Empty>{gm ? "Escreva o roteiro acima e clique em “Iniciar próxima sessão”." : "O Mestre ainda não iniciou nenhuma sessão."}</Empty> : (
          <>
            <div><h2 className="text-2xl">{name(sel)}</h2><p className="text-sm text-parch-500">{sel.date_label}{sel.started_at ? ` · iniciada em ${new Date(sel.started_at).toLocaleDateString("pt-BR")}` : ""}</p></div>
            <Card title="Anotações do grupo (públicas)">
              <SessionText key={`p-${sel.id}`} rpc="session_public_save" args={{ p_session: sel.id }} initial={sel.public_notes} canEdit hint={`Todos os jogadores e o Mestre podem ler e editar. ${hint}`} empty="Ninguém escreveu nesta sessão ainda." startOpen={sel.id === started[0]?.id} />
            </Card>
            {gm && (
              <>
                <Card title="Anotações do Mestre (privadas)">
                  <SessionText key={`g-${sel.id}`} rpc="session_gm_save" args={{ p_session: sel.id, p_field: "gm_notes" }} initial={gmOf(sel.id)?.gm_notes ?? ""} canEdit hint={`Só você vê. ${hint}`} empty="Sem anotações do Mestre." startOpen={sel.id === started[0]?.id} />
                </Card>
                <Card title="Roteiro desta sessão (privado)">
                  <SessionText key={`r-${sel.id}`} rpc="session_gm_save" args={{ p_session: sel.id, p_field: "script" }} initial={gmOf(sel.id)?.script ?? ""} canEdit hint={`Só você vê. ${hint}`} empty="Esta sessão começou sem roteiro." />
                </Card>
              </>)}
          </>)}
      </div>
    </div>
  );
}
