# Etapa 3 — regras raciais, sangramento, Forjado, nível 0, calendário, catálogo

## Migrações aplicadas no Supabase (em ordem)
0008 esquema racial · 0009a funções (Feitos Mágicos, elegibilidade, bênção extra automática, nível 0, conversão) ·
0009b funções (dano, sangramento, absorção, núcleo, avanço de turno) · 0010 catálogo de feitiços + custo variável + lacunas ·
0011 item arcano Filho do Sol · 0012 maldição pertence ao personagem · 0013 bestiário/regiões (RLS, entradas secretas).
(Para trazê-las ao repositório: `npx supabase link --project-ref kgypkewdbrutorqrqjlt && npx supabase db pull`.)

## Mudanças de assinatura de RPC (o frontend já foi atualizado)
- cast_spell(p_character, p_spell, p_roll, p_key, p_invested)  — d20 obrigatório; custo calculado no servidor
- grant_spell(p_char, p_spell, p_note)                          — sem override; elegibilidade racial no servidor
- apply_damage(p_character, p_amount, p_key, p_kind, p_override)
- add_modifier(..., p_supernatural)
- novas: add_bleeding, remove_bleeding, start_absorption, stop_absorption, pierce_core, calendar_date, wield_item, sacrifice_life, edit_modifier

## Bestiário e itens arcanos (importação)
O texto foi extraído do PDF por `scripts/extract_content.py` com prova de integridade (bestiário: 77 entradas = 11 biomas + 11 criaturas de fauna + 55 profanos;
itens arcanos: 16, texto idêntico). Está em `src/data/*.json`. **A importação para o banco NÃO foi executada por mim**: o Mestre (conta is_master) clica em
Gerenciar sistema → Importar conteúdo oficial (idempotente: pula o que já existe). Até lá o bestiário público aparece vazio.

## O que ficou PENDENTE (não implementado)
- Efeitos mecânicos de 15 dos 16 itens arcanos (só o Filho do Sol tem mecânica). Os outros ficam como catálogo (descrição) após a importação.
- Segredo parcial dentro de uma entrada do bestiário (hoje: entrada inteira secreta + tabela creature_gm_notes sem tela).
- Editor visual para associar uma criatura a VÁRIAS regiões (tabela creature_regions existe; a tela edita a região principal).
- Edição de contratos como entidade própria (ficam no catálogo de feitiços com kind='contrato').
- Testes de banco foram executados como SQL avulso (não estão versionados em supabase/tests).

## Como testar no navegador (ainda não testado por mim)
1. Ficha de Humano com feitiço: Usar feitiço → informar d20 → ver multiplicador/custo → confirmar.
2. Painel Sangramento: aplicar grau 3 → Tempo → Passar turno → ver perda e histórico.
3. Forjado: ficha com barra única; deixar a barra < 100% e avançar 11 turnos (Tempo → vários turnos).
4. Nível 0: Nível e experiência → 0 → Ver prévia → Confirmar.
5. Filho do Sol: conceder o item (Itens) → Empunhar → Sacrificar Vida → Largar (maldição).
6. Bestiário: Gerenciar sistema → Importar conteúdo oficial → abrir /bestiario.
