import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Empty, PageTitle, SearchForm } from "@/components/ui";
import type { Topic } from "@/lib/types";

export const metadata = { title: "Regras" };

/* ──────────────────────────────────────────────────────────
   Conteúdo estático dos cards de regras
   ────────────────────────────────────────────────────────── */

function RulesCards() {
  return (
    <div className="space-y-6 mb-10">
      {/* CARD 1 — MAPA DE ARKHAVEL */}
      <section className="card">
        <h2 className="card-title">Mapa de Arkhavel</h2>
        <figure className="mb-4">
          <a href="/img/mapa-arkhavel.webp" target="_blank" rel="noopener"><img src="/img/mapa-arkhavel.webp" alt="Mapa do continente de Arkhavel" width={1536} height={1024} loading="lazy" className="w-full rounded-md border border-gold-600/30" /></a>
          <figcaption className="mt-1 text-xs text-parch-500">Clique para ampliar.</figcaption>
        </figure>
        <div className="space-y-3 text-sm text-parch-100/90">
          <p>Arkhavel é um reino gigantesco, uma verdadeira ilha continental. Seu território é cortado por inúmeros rios e lagos, enquanto o mar que o cerca é conhecido como <strong className="text-gold-300">Águas de Gander</strong>.</p>
          <p>As Águas de Gander são perigosas, habitadas por antigos profanos. Os poucos que se aventuram por suas águas geralmente encontram apenas as ilhas catalogadas próximas a Arkhavel. Cada uma dessas ilhas possui um posto do reino.</p>
          <p>A Capital está localizada no centro da ilha. Ao seu redor, distribuídas pelo território, encontram-se as <strong className="text-gold-300">22 Igrejas</strong>, cada uma representando um Arcano do baralho de Tarot.</p>
          <p>Nas regiões mais afastadas encontram-se as montanhas dos anões, as florestas dos druídas e diversos vilarejos espalhados pelo reino.</p>

          <h3 className="!text-base mt-4 mb-2">Povos e regiões</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-gold-300">Humanos:</strong> predominam nos vilarejos e nas regiões próximas à Capital. Alguns assentamentos são protegidos por Igrejas e por seus devotos mais poderosos.</li>
            <li><strong className="text-gold-300">Druídas:</strong> vivem escondidos em florestas densas, organizados em santuários isolados da sociedade.</li>
            <li><strong className="text-gold-300">Anões:</strong> habitam regiões de difícil acesso aos humanos, aproveitando sua resistência superior. Não são necessariamente oprimidos; historicamente, vivem tranquilamente em suas próprias tribos, sem grandes ambições expansionistas.</li>
          </ul>

          <h3 className="!text-base mt-4 mb-2">Particularidades das Igrejas</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-gold-300">Igreja do Louco:</strong> não possui uma sede fixa. É formada por um grupo nômade de fiéis.</li>
            <li><strong className="text-gold-300">Igreja do Mago:</strong> ocupa uma região inacessível, sem construções. Trata-se de uma falha onde a natureza é instável e mortal, de onde surgem profanos constantemente.</li>
            <li><strong className="text-gold-300">Igreja da Força:</strong> corresponde a uma antiga vila destruída durante a morte do Arcano da Força. Seus sobreviventes e descendentes são profundamente devotos a ele.</li>
          </ul>

          <h3 className="!text-base mt-4 mb-2">Profanos</h3>
          <p>Os profanos se esgueiram por diversas regiões do reino, principalmente nas áreas mais afastadas da Capital. Procuram sobretudo humanos.</p>

          <h3 className="!text-base mt-4 mb-2">Estrutura militar da Capital</h3>
          <p>A Capital possui três escolas militares:</p>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gold-300"><th className="px-2 py-1">Escola</th><th className="px-2 py-1">Função e características</th></tr></thead>
              <tbody>
                <tr className="border-t border-ink-700"><td className="px-2 py-1 font-medium text-gold-400">Guarda</td><td className="px-2 py-1">Responsável por rondas, vigílias e pequenos delitos. Possui treinamento inferior às demais escolas.</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1 font-medium text-gold-400">Militar</td><td className="px-2 py-1">Protege os interesses da Capital e da Família Real. Reúne os indivíduos mais capacitados.</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1 font-medium text-gold-400">Caça</td><td className="px-2 py-1">Explora regiões distantes e enfrenta profanos com maior frequência. Seus integrantes são extremamente experientes.</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2">A maioria dos itens mágicos e dos feitiços existentes está sob controle da Capital.</p>
        </div>
      </section>

      {/* CARD 2 — ECONOMIA E MOEDAS */}
      <section className="card">
        <h2 className="card-title">Economia e Moedas</h2>
        <div className="space-y-3 text-sm text-parch-100/90">
          <h3 className="!text-base mb-2">Sistema monetário</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gold-300"><th className="px-2 py-1">Moeda</th><th className="px-2 py-1">Conversão</th><th className="px-2 py-1">Valor de referência</th></tr></thead>
              <tbody>
                <tr className="border-t border-ink-700"><td className="px-2 py-1 font-medium text-gold-400">Ouro</td><td className="px-2 py-1">1 ouro = 10 pratas</td><td className="px-2 py-1">R$ 500</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1 font-medium text-gold-400">Prata</td><td className="px-2 py-1">1 prata = 10 bronzes</td><td className="px-2 py-1">R$ 50</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1 font-medium text-gold-400">Bronze</td><td className="px-2 py-1">1 bronze</td><td className="px-2 py-1">R$ 5</td></tr>
              </tbody>
            </table>
          </div>
          <p>Todas as moedas possuem peso de 10 gramas e são cunhadas com uma assinatura da Família Vetra e uma numeração de identificação.</p>

          <h3 className="!text-base mt-4 mb-2">Preços de referência</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gold-300"><th className="px-2 py-1">Produto ou serviço</th><th className="px-2 py-1">Preço em Arkhavel</th><th className="px-2 py-1">Valor de referência</th></tr></thead>
              <tbody>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Refeição simples</td><td className="px-2 py-1">2–5 bronzes</td><td className="px-2 py-1">R$ 10–25</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Estalagem comum</td><td className="px-2 py-1">5–10 bronzes</td><td className="px-2 py-1">R$ 25–50</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Arma simples</td><td className="px-2 py-1">5–10 pratas</td><td className="px-2 py-1">R$ 250–500</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Armadura leve</td><td className="px-2 py-1">15–30 pratas</td><td className="px-2 py-1">R$ 750–1.500</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Poção comum</td><td className="px-2 py-1">1 ouro</td><td className="px-2 py-1">R$ 500</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Item mágico raro</td><td className="px-2 py-1">5 ouros ou mais</td><td className="px-2 py-1">R$ 2.500 ou mais</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CARD 3 — COMBATE E REGRAS GERAIS */}
      <section className="card">
        <h2 className="card-title">Combate e Regras Gerais</h2>
        <div className="space-y-3 text-sm text-parch-100/90">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <p><strong className="text-gold-300">Sanidade inicial:</strong> 30.</p>
            <p><strong className="text-gold-300">Regeneração:</strong> Vida +1/turno · Mana +1/turno.</p>
          </div>
          <p><strong className="text-gold-300">Prioridade de resolução:</strong> Contratos → Bênçãos → Feitiços → Ataques Físicos.</p>
          <p><strong className="text-gold-300">Definição de combate:</strong> Combate é um estado narrativo imposto pelo Mestre quando há uma ameaça externa e não consensual, na qual existe risco irreversível real.</p>
          <p><strong className="text-gold-300">Regra do 20 natural:</strong> Dados de acerto que resultem em 20 natural sempre maximizam o dano, independentemente do resultado normal dos dados de dano.</p>

          <h3 className="!text-base mt-4 mb-2">Cristais de Evolução</h3>
          <p>Artefatos capazes de registrar a Experiência (XP) de seus portadores. Ao acumular a quantidade necessária de XP, o cristal atua como uma chave, permitindo a ascensão ao próximo nível e o desenvolvimento natural do corpo e da mana.</p>
          <p>Os mortais podem evoluir até o Nível 21. Acima dele existe apenas o <strong className="text-gold-300">Nível 0</strong>, um estado transcendental que duplica todos os atributos e status de seu portador. O número de indivíduos de Nível 0 existentes no mundo é limitado.</p>

          <div className="rounded-md border border-gold-600/30 bg-ink-900/60 p-3 mt-2 space-y-1">
            <p><strong className="text-gold-300">XP necessário para subir de nível:</strong> <code className="text-arcane-400">50 × nível atual</code></p>
            <p><strong className="text-gold-300">XP recebido por derrotar uma criatura:</strong> <code className="text-arcane-400">20 × nível + 25 × 2^(Periculosidade − 1)</code></p>
          </div>

          <p className="mt-2"><strong className="text-gold-300">Periculosidade:</strong> é diretamente proporcional ao poder de uma maldição. Por se tratar de um contrato, existe uma recompensa adicional de XP. Unicórnios não concedem XP.</p>

          <h3 className="!text-base mt-4 mb-2">Dano de queda</h3>
          <p><strong className="text-gold-300">Dano de queda</strong> = <code className="text-arcane-400">1dH</code>, onde H representa a altura da queda em metros.</p>
          <p className="text-parch-500 text-xs">Exemplo: uma queda de 5 metros causa 1d5 de dano.</p>
        </div>
      </section>

      {/* CARD 4 — SISTEMA DE SANGRAMENTO */}
      <section className="card">
        <h2 className="card-title">Sistema de Sangramento</h2>
        <div className="space-y-3 text-sm text-parch-100/90">
          <p>O sangramento representa a perda progressiva de vida causada por ferimentos. A porcentagem indicada é descontada da Vida máxima do personagem a cada turno.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gold-300"><th className="px-2 py-1">Gravidade do ferimento</th><th className="px-2 py-1 text-right whitespace-nowrap">Perda / turno</th></tr></thead>
              <tbody>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Arranhões na pele e cortes leves superficiais</td><td className="px-2 py-1 text-right text-wine-400">−1% HP</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Cortes leves em músculos, atingindo pequenos vasos</td><td className="px-2 py-1 text-right text-wine-400">−2% HP</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Cortes moderados em músculos, atingindo vasos médios</td><td className="px-2 py-1 text-right text-wine-400">−3% HP</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Cortes profundos em músculos principais, atingindo grandes vasos periféricos</td><td className="px-2 py-1 text-right text-wine-400">−4% HP</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Perfurações no tronco ou abdômen, atingindo órgãos leves</td><td className="px-2 py-1 text-right text-wine-400">−5% HP</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Ferimentos graves com múltiplos órgãos atingidos ou grandes vasos rompidos</td><td className="px-2 py-1 text-right text-wine-400">−10% HP</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Colapso estrutural crítico, com ruptura de grandes vasos centrais</td><td className="px-2 py-1 text-right text-wine-400">−15% HP</td></tr>
                <tr className="border-t border-ink-700 bg-wine-600/10"><td className="px-2 py-1">Dano extremo com destruição massiva de estruturas vitais centrais</td><td className="px-2 py-1 text-right font-semibold text-red-300">Morte iminente</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-parch-500 mt-1">Ataques que provocam inconsciência imediata (perfurações cerebrais e outros danos que incapacitem instantaneamente o personagem) não estão incluídos nesta tabela.</p>
        </div>
      </section>

      {/* CARD 5 — FORÇA E FORÇA DE MASSA (FM) */}
      <section className="card">
        <h2 className="card-title">Força e Força de Massa (FM)</h2>
        <div className="space-y-3 text-sm text-parch-100/90">
          <p>Todos os personagens começam com <strong className="text-gold-300">4 pontos de Força de Massa (FM)</strong>, exceto os profanos, que começam com 1 ponto.</p>

          <h3 className="!text-base mt-4 mb-2">Progressão da Força de Massa</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gold-300"><th className="px-2 py-1">Espécie</th><th className="px-2 py-1">Progressão</th></tr></thead>
              <tbody>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Humanos</td><td className="px-2 py-1">+1 FM a cada 3 níveis</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Anões</td><td className="px-2 py-1">+1 FM a cada nível</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Druídas</td><td className="px-2 py-1">+1 FM a cada 2 níveis</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Profanos</td><td className="px-2 py-1">+1 FM a cada 4 níveis</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="!text-base mt-4 mb-2">Categorias de Força de Massa</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gold-300"><th className="px-2 py-1">Categoria</th><th className="px-2 py-1">Exemplos</th><th className="px-2 py-1 text-right">FM</th></tr></thead>
              <tbody>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Muito leve</td><td className="px-2 py-1 text-parch-300">Flecha, faca</td><td className="px-2 py-1 text-right text-gold-400">1</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Leve</td><td className="px-2 py-1 text-parch-300">Espada, criança</td><td className="px-2 py-1 text-right text-gold-400">2</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Médio</td><td className="px-2 py-1 text-parch-300">Humano adulto</td><td className="px-2 py-1 text-right text-gold-400">4</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Pesado</td><td className="px-2 py-1 text-parch-300">Cavalo, ogro</td><td className="px-2 py-1 text-right text-gold-400">8</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Muito pesado</td><td className="px-2 py-1 text-parch-300">Elefante, carroça</td><td className="px-2 py-1 text-right text-gold-400">16</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Colossal</td><td className="px-2 py-1 text-parch-300">Prédio, golem gigante</td><td className="px-2 py-1 text-right text-gold-400">32</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="!text-base mt-4 mb-2">Multiplicadores de dano por aceleração</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gold-300"><th className="px-2 py-1">Tipo de impacto</th><th className="px-2 py-1 text-right">Dano</th></tr></thead>
              <tbody>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Arremesso</td><td className="px-2 py-1 text-right text-arcane-400">FM × 2</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Queda de até 5 metros</td><td className="px-2 py-1 text-right text-arcane-400">FM × 4</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Projétil</td><td className="px-2 py-1 text-right text-arcane-400">FM × 8</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Mach 1 ou superior</td><td className="px-2 py-1 text-right text-arcane-400">FM × 10</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="!text-base mt-4 mb-2">Dano de explosões</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gold-300"><th className="px-2 py-1">Intensidade</th><th className="px-2 py-1 text-right">Dano</th></tr></thead>
              <tbody>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Pequena</td><td className="px-2 py-1 text-right text-arcane-400">1d10</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Média</td><td className="px-2 py-1 text-right text-arcane-400">1d20</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Grande</td><td className="px-2 py-1 text-right text-arcane-400">1d20 + 1d10</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Massiva</td><td className="px-2 py-1 text-right text-arcane-400">2d20</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1">Catastrófica</td><td className="px-2 py-1 text-right text-arcane-400">3d20</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CARD 6 — MOVIMENTAÇÃO E VELOCIDADE */}
      <section className="card">
        <h2 className="card-title">Movimentação e Velocidade</h2>
        <div className="space-y-3 text-sm text-parch-100/90">
          <p>A velocidade-base (<strong className="text-gold-300">V</strong>) começa em 1 m/s e aumenta em 1 m/s a cada 4 níveis.</p>

          <h3 className="!text-base mt-4 mb-2">Limites de movimentação</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gold-300"><th className="px-2 py-1">Movimento</th><th className="px-2 py-1">Velocidade máxima</th><th className="px-2 py-1">Características</th></tr></thead>
              <tbody>
                <tr className="border-t border-ink-700"><td className="px-2 py-1 font-medium text-gold-400">Mover</td><td className="px-2 py-1 text-arcane-400">1 × V</td><td className="px-2 py-1">Movimento normal</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1 font-medium text-gold-400">Correr</td><td className="px-2 py-1 text-arcane-400">2 × V</td><td className="px-2 py-1">Impõe penalidades defensivas</td></tr>
                <tr className="border-t border-ink-700"><td className="px-2 py-1 font-medium text-gold-400">Sprint</td><td className="px-2 py-1 text-arcane-400">3 × V</td><td className="px-2 py-1">Consome a ação completa e gera fadiga</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="!text-base mt-4 mb-2">Modificadores de terreno e condição</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Terreno difícil, carga pesada ou personagem debilitado: <strong className="text-arcane-400">0,5 × V</strong>.</li>
            <li>Euforia, pico de poder ou terreno favorável: <strong className="text-arcane-400">2 × V</strong>.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Página principal de regras (cards estáticos + tópicos dinâmicos)
   ────────────────────────────────────────────────────────── */

export default async function Regras({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const sb = await createClient();
  let query = sb.from("rule_topics").select("*").is("campaign_id", null).eq("status", "published").order("sort_order").order("title");
  if (q) query = query.or(`title.ilike.%${q.replace(/[%,]/g, " ")}%,body_md.ilike.%${q.replace(/[%,]/g, " ")}%`);
  const { data } = await query;
  const topics = (data ?? []) as Topic[];
  return (
    <>
      <PageTitle sub="Regras, lore e referências do sistema Arcano">Regras de Arkhavel</PageTitle>
      <RulesCards />
      {topics.length > 0 && (
        <>
          <h2 className="text-xl mb-3 mt-2">Tópicos publicados pelo Mestre</h2>
          <SearchForm q={q} placeholder="Pesquisar nas regras…" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {topics.map((t) => <li key={t.id}><Link href={`/regras/${t.slug}`} className="card block no-underline hover:border-gold-400"><h2 className="text-lg">{t.title}</h2></Link></li>)}
          </ul>
        </>
      )}
    </>
  );
}
