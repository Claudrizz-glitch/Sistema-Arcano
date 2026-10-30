"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Msg } from "./client";

type Mode = "entrar" | "cadastrar" | "recuperar" | "nova-senha";
const TITLE: Record<Mode, string> = { entrar: "Entrar", cadastrar: "Criar conta", recuperar: "Recuperar senha", "nova-senha": "Definir nova senha" };

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") && params.get("next")!.startsWith("/") ? params.get("next")! : "/painel";
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "erro"; text: string } | null>(null);
  const site = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim(); const password = String(f.get("password") ?? "");
    setBusy(true); setMsg(null);
    const sb = createClient();
    try {
      if (mode === "entrar") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) return setMsg({ kind: "erro", text: error.message.includes("Invalid") ? "E-mail ou senha incorretos." : error.message });
        router.push(next); router.refresh();
      } else if (mode === "cadastrar") {
        if (password.length < 8) return setMsg({ kind: "erro", text: "A senha deve ter pelo menos 8 caracteres." });
        const display_name = String(f.get("nome") ?? "").trim() || email.split("@")[0];
        // O papel de Mestre NUNCA é escolhido aqui: profiles.is_master só muda por SQL administrativo.
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { display_name }, emailRedirectTo: `${site}/auth/callback` } });
        if (error) return setMsg({ kind: "erro", text: error.message });
        if (data.session) { router.push("/painel"); router.refresh(); }
        else setMsg({ kind: "ok", text: "Conta criada. Confirme seu e-mail para entrar (verifique a caixa de spam)." });
      } else if (mode === "recuperar") {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${site}/auth/callback?next=/nova-senha` });
        if (error) return setMsg({ kind: "erro", text: error.message });
        setMsg({ kind: "ok", text: "Se o e-mail existir, enviamos o link de recuperação." });
      } else {
        if (password.length < 8) return setMsg({ kind: "erro", text: "A senha deve ter pelo menos 8 caracteres." });
        const { error } = await sb.auth.updateUser({ password });
        if (error) return setMsg({ kind: "erro", text: error.message });
        setMsg({ kind: "ok", text: "Senha alterada." }); router.push("/painel");
      }
    } finally { setBusy(false); }
  }
  return (
    <div className="mx-auto mt-10 max-w-md">
      <section className="card">
        <h1 className="mb-4 text-2xl">{TITLE[mode]}</h1>
        <form onSubmit={submit} className="space-y-3">
          {mode === "cadastrar" && (<div><label className="label" htmlFor="nome">Nome de exibição</label><input id="nome" name="nome" className="input" maxLength={60} /></div>)}
          {mode !== "nova-senha" && (<div><label className="label" htmlFor="email">E-mail</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>)}
          {mode !== "recuperar" && (<div><label className="label" htmlFor="password">{mode === "nova-senha" ? "Nova senha" : "Senha"}</label>
            <input id="password" name="password" type="password" required minLength={mode === "entrar" ? 1 : 8} autoComplete={mode === "entrar" ? "current-password" : "new-password"} className="input" /></div>)}
          <Msg m={msg} />
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Aguarde…" : TITLE[mode]}</button>
        </form>
        <p className="mt-4 space-x-3 text-sm">
          {mode !== "entrar" && <Link href="/entrar">Já tenho conta</Link>}
          {mode !== "cadastrar" && <Link href="/cadastrar">Criar conta</Link>}
          {mode === "entrar" && <Link href="/recuperar-senha">Esqueci a senha</Link>}
        </p>
        {mode === "cadastrar" && <p className="mt-3 text-xs text-parch-500">Novas contas sempre entram como jogador. O papel de Mestre é concedido apenas pelo administrador do projeto.</p>}
      </section>
    </div>
  );
}
