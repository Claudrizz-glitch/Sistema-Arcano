# Arkhavel — Sistema Arcano (plataforma web)

Next.js 15 (App Router) + TypeScript estrito + Tailwind + Supabase (Auth, Postgres/RLS/RPC, Realtime).
O backend (esquema, RLS, RPCs, seed oficial) JÁ está no ar no projeto Supabase `kgypkewdbrutorqrqjlt` (sa-east-1).
Este repositório contém o frontend e o núcleo de regras testado.

## Rodar localmente
    cd arkhavel
    npm install
    cp .env.example .env.local        # já contém URL e a chave PÚBLICA (publishable/anon). Nunca use service_role aqui.
    npm run dev                       # http://localhost:3000
    npm run typecheck && npm test     # tipos + 16 testes do núcleo de regras

## Ajustes no painel do Supabase (uma vez)
1. Authentication → URL Configuration: Site URL = http://localhost:3000 (depois o domínio da Vercel) e
   Redirect URLs = <site>/auth/callback.
2. Authentication → Providers → Email: deixe "Confirm email" ligado em produção (ou desligue só para testar).
3. Torne-se Mestre (único caminho): crie sua conta pelo site e, no SQL Editor:
       update public.profiles set is_master = true where id = (select id from auth.users where email = 'SEU@EMAIL');
4. (Opcional) Traga as migrações para o repositório:
       npx supabase login && npx supabase link --project-ref kgypkewdbrutorqrqjlt && npx supabase db pull
5. Rode Advisors → Security no painel e confira os avisos.

## GitHub e Vercel
    git init && git add . && git commit -m "Frontend Arkhavel"
    gh repo create arkhavel --private --source=. --push     # ou crie no site e use git remote add/push
Vercel: Import Project → framework Next.js → Environment Variables:
    NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL (domínio final) → Deploy.
Depois ajuste Site URL/Redirect URLs do Supabase para o domínio da Vercel.

## Mapa do código
src/app            rotas (público, /entrar, /painel, /campanha/[id]/…)
src/components     UI, painéis do Mestre, editor de conteúdo, tempo real
src/lib            clientes Supabase, tipos, erros traduzidos, config dos editores
src/domain         regras puras testadas (dados, progressão, regeneração, bênçãos…)
Toda escrita sensível passa por RPC do banco; o frontend só chama e mostra o resultado confirmado.
