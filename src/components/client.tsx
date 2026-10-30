"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendly } from "@/lib/errors";

export type RpcResult = { ok: true; data: any } | { ok: false; error: string };

/** Executa RPCs reais do Supabase. `busy` impede cliques repetidos; cada tentativa gera 1 chave de idempotência. */
export function useRpc() {
  const sb = useMemo(() => createClient(), []);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "erro"; text: string } | null>(null);
  const lock = useRef(false);
  const run = useCallback(async (fn: string, args: Record<string, unknown>, okText?: string): Promise<RpcResult> => {
    if (lock.current) return { ok: false, error: "Operação em andamento." };
    lock.current = true; setBusy(true); setMsg(null);
    try {
      const { data, error } = await sb.rpc(fn, args);
      if (error) { const t = friendly(error.message); setMsg({ kind: "erro", text: t }); return { ok: false, error: t }; }
      // só afirmamos sucesso depois da confirmação do servidor
      if (okText) setMsg({ kind: "ok", text: okText });
      router.refresh();
      return { ok: true, data };
    } finally { lock.current = false; setBusy(false); }
  }, [sb, router]);
  return { run, busy, msg, setMsg, sb };
}
export const newKey = (): string => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random());

export function Msg({ m }: { m: { kind: "ok" | "erro"; text: string } | null }) {
  if (!m) return null;
  const c = m.kind === "ok" ? "border-emerald-600/60 text-emerald-300" : "border-wine-400 text-red-300";
  return <p role={m.kind === "erro" ? "alert" : "status"} className={`rounded-md border bg-ink-900 px-3 py-2 text-sm ${c}`}>{m.kind === "ok" ? "✓ " : "⚠ "}{m.text}</p>;
}

/** Botão que chama uma RPC (com confirmação opcional). */
export function RpcButton({ fn, args, label, ok, confirm, className = "btn", withKey, disabled }: {
  fn: string; args: Record<string, unknown>; label: ReactNode; ok?: string; confirm?: string; className?: string; withKey?: string; disabled?: boolean;
}) {
  const { run, busy, msg } = useRpc();
  return (
    <span className="inline-flex flex-col gap-1">
      <button className={className} disabled={busy || disabled} onClick={async () => {
        if (confirm && !window.confirm(confirm)) return;
        await run(fn, withKey ? { ...args, [withKey]: newKey() } : args, ok);
      }}>{busy ? "…" : label}</button>
      {msg?.kind === "erro" && <Msg m={msg} />}
    </span>
  );
}

/** Atualiza a tela quando o banco muda (Supabase Realtime respeita o RLS). */
export function RealtimeRefresh({ tables, filter }: { tables: string[]; filter?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"conectando" | "ao vivo" | "falha">("conectando");
  useEffect(() => {
    const sb = createClient();
    let t: ReturnType<typeof setTimeout> | undefined;
    const ch = sb.channel("rt-" + tables.join("-") + (filter ?? ""));
    for (const table of tables) {
      ch.on("postgres_changes", { event: "*", schema: "public", table, ...(filter && table === tables[0] ? { filter } : {}) }, () => {
        clearTimeout(t); t = setTimeout(() => router.refresh(), 250); // agrupa rajadas
      });
    }
    ch.subscribe((s: string) => setState(s === "SUBSCRIBED" ? "ao vivo" : s === "CHANNEL_ERROR" || s === "TIMED_OUT" ? "falha" : "conectando"));
    return () => { clearTimeout(t); sb.removeChannel(ch); };
  }, [router, tables.join(","), filter]);
  return (
    <span className={`badge ${state === "ao vivo" ? "border-emerald-500 text-emerald-300" : state === "falha" ? "border-wine-400 text-red-300" : "border-parch-500 text-parch-300"}`} title="Sincronização em tempo real">
      {state === "ao vivo" ? "● ao vivo" : state === "falha" ? "⚠ sem sincronização — recarregue" : "○ conectando"}
    </span>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return <button className="btn btn-sm" onClick={async () => { await createClient().auth.signOut(); router.push("/"); router.refresh(); }}>Sair</button>;
}
