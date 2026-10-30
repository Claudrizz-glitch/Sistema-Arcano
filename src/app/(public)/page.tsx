import Link from "next/link";

const CARDS = [
  { href: "/regras", t: "Regras do sistema", d: "Progressão, combate, sangramento, economia e mais." },
  { href: "/racas", t: "Raças e progressão", d: "Humano, Anão, Druída, Profano, Forjado — tabelas de 21 níveis." },
  { href: "/feiticos", t: "Feitiços", d: "Técnicas fundamentais, gerais, elementais e druídicos." },
  { href: "/bencaos", t: "As 22 Bênçãos", d: "Seis grupos, cada um com sua bênção extra." },
  { href: "/itens", t: "Equipamentos e itens", d: "Armas, armaduras, poções e itens arcanos." },
];
export default function Home() {
  return (
    <>
      <section className="py-10 text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-parch-500">Sistema Arcano</p>
        <h1 className="mt-2 text-5xl sm:text-6xl">Arkhavel</h1>
        <div className="divider mx-auto max-w-md" />
        <p className="mx-auto max-w-2xl text-parch-300">
          Antes da ascensão da humanidade, os Arcanos concederam aos homens o dom da magia e desapareceram misteriosamente,
          deixando suas bênçãos sob a guarda das Igrejas. A cada 22 anos, no primeiro dia da primavera, ocorre o Grande Eclipse —
          e uma conspiração busca roubar as bênçãos nesse momento.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link className="btn btn-primary no-underline" href="/regras">Ler as regras</Link>
          <Link className="btn no-underline" href="/entrar">Entrar na campanha</Link>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="card no-underline transition hover:border-gold-400">
            <h2 className="text-xl">{c.t}</h2><p className="mt-1 text-sm text-parch-300">{c.d}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
