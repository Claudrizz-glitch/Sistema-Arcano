import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Troca o código do e-mail (confirmação/recuperação) por uma sessão.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const dest = next && next.startsWith("/") ? next : "/painel";
  if (code) {
    const sb = await createClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${dest}`);
    // O Supabase já confirmou o e-mail ao abrir o link; a troca do código só falha quando o link foi aberto em outro
    // navegador/aparelho (sem o cookie PKCE) ou já tinha sido usado. A conta está confirmada: basta entrar com a senha.
    return NextResponse.redirect(`${origin}/entrar?confirmado=1&next=${encodeURIComponent(dest)}`);
  }
  return NextResponse.redirect(`${origin}/entrar?erro=link_invalido`);
}
