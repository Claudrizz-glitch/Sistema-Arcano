import type { ReactNode } from "react";

/** Renderizador mínimo e seguro (sem HTML cru): ##/### títulos, listas, **negrito**, tabelas simples com |, imagem em linha própria ![legenda](/caminho ou https://). */
function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>));
}
export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const out: ReactNode[] = [];
  let list: string[] = []; let table: string[][] = []; let para: string[] = [];
  const flush = (k: number) => {
    if (para.length) { out.push(<p key={`p${k}`}>{inline(para.join(" "))}</p>); para = []; }
    if (list.length) { out.push(<ul key={`l${k}`}>{list.map((x, i) => <li key={i}>{inline(x)}</li>)}</ul>); list = []; }
    if (table.length) {
      const [head, ...rows] = table;
      out.push(<div key={`t${k}`} className="mb-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr>{head.map((h, i) => <th key={i} className="border-b border-gold-600/40 px-2 py-1 text-left text-gold-300">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border-b border-ink-700 px-2 py-1">{c}</td>)}</tr>)}</tbody></table></div>);
      table = [];
    }
  };
  lines.forEach((raw, k) => {
    const l = raw.trim();
    if (!l) return flush(k);
    if (l.startsWith("### ")) { flush(k); out.push(<h3 key={k} className="mt-4 mb-1 text-lg">{l.slice(4)}</h3>); }
    else if (l.startsWith("## ")) { flush(k); out.push(<h2 key={k}>{l.slice(3)}</h2>); }
    else if (l.startsWith("# ")) { flush(k); out.push(<h2 key={k}>{l.slice(2)}</h2>); }
    else if (/^!\[[^\]]*\]\((\/[^\s)]+|https:\/\/[^\s)]+)\)$/.test(l)) {
      flush(k); const m = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(l)!;
      out.push(<figure key={k} className="my-3"><a href={m[2]} target="_blank" rel="noopener"><img src={m[2]} alt={m[1]} loading="lazy" className="mx-auto block max-h-[48rem] w-auto max-w-full rounded-md border border-gold-600/30" /></a>{m[1] && <figcaption className="mt-1 text-xs text-parch-500">{m[1]}</figcaption>}</figure>);
    }
    else if (/^[-*] /.test(l)) { if (para.length || table.length) flush(k); list.push(l.slice(2)); }
    else if (l.startsWith("|")) { if (para.length || list.length) flush(k); if (!/^\|[\s:|-]+\|?$/.test(l)) table.push(l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim())); }
    else { if (list.length || table.length) flush(k); para.push(l); }
  });
  flush(lines.length);
  return <div className="prose-rules">{out}</div>;
}
