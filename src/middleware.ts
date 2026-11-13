import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Renova a sessão e exige login nas áreas privadas. A segurança real está no RLS/RPC do banco.
export async function middleware(request: NextRequest) {
  // Se o Supabase devolver o código de login em outra página (ex.: a inicial, quando o redirect não está na lista
  // permitida), encaminha para o callback que troca o código pela sessão.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback"; url.search = "";
    url.searchParams.set("code", code); url.searchParams.set("next", "/painel");
    return NextResponse.redirect(url);
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const privada = path.startsWith("/painel") || path.startsWith("/campanha");
  if (privada && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
