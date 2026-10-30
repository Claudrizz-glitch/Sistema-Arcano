# Arkhavel — instalação e estado atual

## Backend (JÁ NO AR)
Projeto Supabase `arkhavel` (id `kgypkewdbrutorqrqjlt`, região sa-east-1, plano gratuito).
Migrações aplicadas (ver `list_migrations`): 0001 esquema · 0002 RLS/visões · 0003 RPCs de fichas ·
0004 RPCs de jogo · 0005 seed oficial · 0006/0007 correções.

### Tornar-se Mestre (bootstrap seguro)
Ninguém vira Mestre pelo cadastro. Depois de criar sua conta pelo site, no SQL Editor do Supabase:
    update public.profiles set is_master = true where id = '<seu uuid de auth.users>';
Só então `create_campaign` passa a funcionar para você.

### Regras que o banco impõe (testadas)
limite de 10 fichas/jogador/campanha · uma ficha ativa por jogador · morta não reativa · jogador sem escrita direta
(só `update_my_sheet`: descrição, inventário, retrato) · custo do feitiço vem do catálogo · idempotência por
`idempotency_key` · avanço de turno exige `expected_turn` · regeneração por `last_regen_turn` · NPC privado não vaza.

## Frontend (PRÓXIMA ETAPA)
Next.js + TS + Tailwind + shadcn/ui. Variáveis (.env.local, nunca commitar a service key):
    NEXT_PUBLIC_SUPABASE_URL=https://kgypkewdbrutorqrqjlt.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key do painel>

## Núcleo de regras (este pacote)
    node --experimental-strip-types --test tests/domain.test.ts     # sem dependências
    python3 scripts/extract_progressions.py <PDF>                    # regera seed/progressions.json
