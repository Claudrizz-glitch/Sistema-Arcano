"use client";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendly } from "@/lib/errors";
import bestiary from "@/data/bestiary.json";
import arcane from "@/data/arcane_items.json";

type B = { name: string; kind: "bioma" | "criatura"; category: "fauna_flora" | "profano"; periculosidade: number | null; region: string | null; description: string };
type A = { emoji: string; name: string; description: string };
const NAME_FIX: Record<string, string> = { "Orbe de selamento": "Orbe de Selamento", "Máscara da vitória": "Máscara da Vitória", "Sapato de escalada": "Sapato de Escalada", "Fio bifurcado": "Fio Bifurcado", "OLHO DE COBRA": "Olho de Cobra" };

/** Importa o texto ORIGINAL (extraído do PDF por script, com verificação de integridade). Idempotente: nunca duplica nem sobrescreve. */
export function ImportTool({ userId }: { userId: string }) {
  const sb = useMemo(() => createClient(), []);
  const [log, setLog] = useState<string[]>([]); const [busy, setBusy] = useState(false);
  const B = bestiary as B[]; const A = arcane as A[];
  const add = (t: string) => setLog((l) => [...l, t]);
  async function run() {
    if (busy) return; setBusy(true); setLog([]);
    try {
      const { data: er } = await sb.from("regions").select("id,name").is("campaign_id", null); const regions = new Map((er ?? []).map((r: { id: string; name: string }) => [r.name.toLowerCase(), r.id]));
      const newRegions = B.filter((e) => e.kind === "bioma" && !regions.has(e.name.toLowerCase()));
      if (newRegions.length) {
        const { data, error } = await sb.from("regions").insert(newRegions.map((e) => ({ name: e.name, kind: "bioma", description: e.description, status: "published", source: "official", created_by: userId, updated_by: userId }))).select("id,name");
        if (error) throw new Error(friendly(error.message)); (data ?? []).forEach((r: { id: string; name: string }) => regions.set(r.name.toLowerCase(), r.id));
      }
      add(`Regiões/biomas: ${newRegions.length} novas, ${B.filter((e) => e.kind === "bioma").length - newRegions.length} já existiam.`);
      const { data: ec } = await sb.from("creatures").select("name").is("campaign_id", null); const have = new Set((ec ?? []).map((c: { name: string }) => c.name.toLowerCase()));
      const cre = B.filter((e) => e.kind === "criatura" && !have.has(e.name.toLowerCase()));
      for (let i = 0; i < cre.length; i += 20) {
        const chunk = cre.slice(i, i + 20).map((e) => ({ name: e.name, category: e.category, periculosidade: e.periculosidade, region_id: e.region ? regions.get(e.region.toLowerCase()) ?? null : null, description: e.description, status: "published", source: "official", created_by: userId, updated_by: userId }));
        const { error } = await sb.from("creatures").insert(chunk); if (error) throw new Error(friendly(error.message)); add(`Criaturas: ${Math.min(i + 20, cre.length)}/${cre.length}…`);
      }
      add(`Criaturas: ${cre.length} novas, ${B.filter((e) => e.kind === "criatura").length - cre.length} já existiam.`);
      const { data: ei } = await sb.from("items").select("name").is("campaign_id", null); const haveI = new Set((ei ?? []).map((c: { name: string }) => c.name.toLowerCase()));
      const its = A.filter((a) => !haveI.has((NAME_FIX[a.name] ?? a.name).toLowerCase()));
      if (its.length) {
        const { error } = await sb.from("items").insert(its.map((a) => ({ name: NAME_FIX[a.name] ?? a.name, kind: "arcano", description: a.description, properties: { emoji: a.emoji, implemented: false }, notes: "Descrição oficial cadastrada. Os efeitos mecânicos ainda NÃO são aplicados automaticamente na ficha.", status: "published", source: "official", created_by: userId, updated_by: userId })));
        if (error) throw new Error(friendly(error.message));
      }
      add(`Itens arcanos: ${its.length} novos, ${A.length - its.length} já existiam (ex.: Filho do Sol, com mecânica própria).`);
      add("✓ Importação concluída.");
    } catch (e) { add("⚠ " + (e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  }
  return (
    <div className="card space-y-3">
      <p className="text-sm text-parch-300">Pronto para importar: <b>{B.filter((e) => e.kind === "bioma").length}</b> biomas, <b>{B.filter((e) => e.kind === "criatura").length}</b> criaturas (<b>{B.filter((e) => e.category === "fauna_flora" && e.kind === "criatura").length}</b> de fauna e <b>{B.filter((e) => e.category === "profano").length}</b> profanos) e <b>{A.length}</b> itens arcanos. Entradas já existentes são puladas.</p>
      <button className="btn btn-primary" disabled={busy} onClick={run}>{busy ? "Importando…" : "Importar conteúdo oficial"}</button>
      <ul className="space-y-1 text-sm" aria-live="polite">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
      <p className="text-xs text-parch-500">Itens arcanos importados ficam como catálogo (descrição). Só o Filho do Sol tem mecânica funcional nesta versão.</p>
    </div>
  );
}
