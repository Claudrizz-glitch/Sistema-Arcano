-- Exclusão pedida pelo Mestre em 2026-11-13: fichas de teste antigas (4 inativas + "robozinho", morta).
-- As 5 fichas importadas do doc NÃO estão aqui.
delete from public.characters where id in (
  '781fb8cd-7707-46fb-ac2a-46f5754215d6', -- robozinho (morta)
  '7c8947fc-2328-4e0a-9ff8-53883c07e702', -- Adamastor, o grande (cópia antiga, nível 10)
  '3a346b04-e0f5-4b5b-ab7f-257f62c03aa8', -- Adamastor, o grande (cópia antiga, nível 10)
  'ad5f2de6-ba11-4ae2-9274-0c855bfe922a', -- Jorge (nível 1, jogador Teste)
  'eda85cd9-511f-4353-bcbf-e5671da51109'  -- roger
);
