import Link from "next/link";
import { requireUser } from "@/lib/data";
import { Card, Empty, PageTitle } from "@/components/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { CreateCampaignForm, JoinCampaignForm } from "@/components/CampaignForms";
import type { Campaign, Member } from "@/lib/types";

export const metadata = { title: "Meu painel" };
export default async function Painel() {
  const { sb, user, profile } = await requireUser();
  const [{ data: cs }, { data: ms }] = await Promise.all([
    sb.from("campaigns").select("*").order("created_at", { ascending: false }),
    sb.from("campaign_members").select("*").eq("user_id", user.id),
  ]);
  const roles = new Map(((ms ?? []) as Member[]).map((m) => [m.campaign_id, m.role]));
  const campaigns = (cs ?? []) as Campaign[];
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <PageTitle sub={`Olá, ${profile.display_name}${profile.is_master ? " — Mestre autorizado" : ""}`}>Meu painel</PageTitle>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card title="Minhas campanhas">
              {campaigns.length === 0 ? <Empty>Você ainda não participa de nenhuma campanha. Use um código de convite ao lado{profile.is_master ? " ou crie uma nova campanha" : ""}.</Empty> : (
                <ul className="space-y-2">{campaigns.map((c) => (
                  <li key={c.id}><Link href={`/campanha/${c.id}`} className="flex items-center justify-between rounded-md border border-ink-600 px-3 py-2 no-underline hover:border-gold-400">
                    <span className="font-display text-lg">{c.name}</span><span className="badge border-gold-600/50">{roles.get(c.id) === "mestre" ? "Mestre" : "Jogador"}</span></Link></li>))}</ul>)}
            </Card>
          </div>
          <div className="space-y-4">
            <Card title="Entrar em uma campanha"><JoinCampaignForm /></Card>
            {profile.is_master ? <Card title="Nova campanha"><CreateCampaignForm /></Card>
              : <Card title="Quer ser Mestre?"><p className="text-sm text-parch-300">O papel de Mestre é concedido pelo administrador do projeto — não é possível escolhê-lo no cadastro.</p></Card>}
          </div>
        </div>
      </main>
    </>
  );
}
