-- Teste de Feitos Mágicos: o +5 do Profano ao pé da letra (pior resultado = 6).
update rule_topics set body_md = replace(body_md, '- Profanos somam **+5** ao resultado (vantagem em feitos mágicos).', '- Profanos somam **+5** ao dado ao pé da letra: o pior resultado deles é **6**, e sofrem no máximo as consequências de um 6.')
where slug = 'teste-de-feitos-magicos' and campaign_id is null;
