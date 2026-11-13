import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Campaign, Profile, Role } from "@/lib/types";

export async function requireUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/entrar");
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { sb, user, profile: (profile ?? { id: user.id, display_name: user.email ?? "Aventureiro", is_master: false }) as Profile };
}
/** Contexto de uma campanha. Se o usuário não é membro, o RLS devolve vazio => 404 (não vaza existência). */
export async function campaignContext(id: string) {
  const ctx = await requireUser();
  const { data: c } = await ctx.sb.from("campaigns").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();
  const { data: m } = await ctx.sb.from("campaign_members").select("role").eq("campaign_id", id).eq("user_id", ctx.user.id).maybeSingle();
  if (!m) notFound();
  // O contador de turnos mostrado no site recomeça a cada sessão; o calendário usa o turno absoluto e continua.
  const { data: ses } = await ctx.sb.from("sessions").select("number,start_turn").eq("campaign_id", id).not("started_at", "is", null).order("number", { ascending: false }).limit(1).maybeSingle();
  const sessionStart = Number((ses as { start_turn: number } | null)?.start_turn ?? 0);
  const campaign = c as Campaign;
  return { ...ctx, campaign, role: (m as { role: Role }).role, sessionStart, sessionNumber: (ses as { number: number } | null)?.number ?? null,
    sessionTurn: Math.max(0, campaign.current_turn - sessionStart) };
}
export async function requireGm(id: string) {
  const ctx = await campaignContext(id);
  if (ctx.role !== "mestre") redirect(`/campanha/${id}`);
  return ctx;
}
/** Gerenciar sistema: conteúdo oficial, só para Mestres autorizados da plataforma. */
export async function requireMaster() {
  const ctx = await requireUser();
  if (!ctx.profile.is_master) redirect("/painel");
  return ctx;
}
