-- Druída Puro passa a aparecer como variante do Druída (o registro em races continua existindo porque as regras
-- das fichas convertidas dependem dele). Texto sintetizado do doc "Sistema Arcano" (item Semente da Natureza).
insert into public.race_variants (race_slug, slug, name, description) values ('druida', 'druida_puro', 'Druída Puro',
$T$Figura humanoide ligada de forma absoluta ao ciclo natural. Ninguém nasce Druída Puro: qualquer ser, de qualquer raça, é convertido permanentemente ao consumir a Semente da Natureza, e passa a seguir a tabela de progressão própria do Druída Puro.
- Acesso absoluto a todos os feitiços druídicos e liberdade quanto ao restante dos feitiços.
- Só transforma o próprio corpo com base em animais que ele mesmo executou e consumiu.
- Lealdade animal: com Voz da Natureza, Olhos da Floresta e Passos Silvestres ativos ao mesmo tempo, submete o animal e aplica Benção Verdejante sobre ele; a lealdade é absoluta.
- Ao matar outro Druída Puro e consumir sua carne, pode assimilar habilidades, traços ou poderes ligados à natureza que ele possuía. Só funciona entre Druídas Puros e rompe severamente o equilíbrio natural, atraindo consequências narrativas inevitáveis.$T$)
on conflict (race_slug, slug) do update set name = excluded.name, description = excluded.description;

update public.races set
  description = 'Figura humanoide ligada de forma absoluta ao ciclo natural. Variante do Druída obtida apenas por conversão permanente (Semente da Natureza), vinda de qualquer raça.',
  notes = $T$Acesso absoluto a todos os feitiços druídicos e liberdade quanto ao restante dos feitiços.
Só transforma o próprio corpo com base em animais que ele mesmo executou e consumiu.
Lealdade animal: com Voz da Natureza, Olhos da Floresta e Passos Silvestres ativos ao mesmo tempo, submete o animal e aplica Benção Verdejante; a lealdade é absoluta.
Ao matar outro Druída Puro e consumir sua carne, pode assimilar habilidades, traços ou poderes ligados à natureza que ele possuía (só entre Druídas Puros; rompe o equilíbrio natural e atrai consequências narrativas).$T$
where slug = 'druida_puro';
