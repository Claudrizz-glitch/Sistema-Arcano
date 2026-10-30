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
  return { ...ctx, campaign: c as Campaign, role: (m as { role: Role }).role };
}
export async function requireGm(id: string) {
  const ctx = await campaignContext(id);
  if (ctx.role !== "mestre") redirect(`/campanha/${id}`);
  return ctx;
}
