import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ title, children, className = "", actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-title flex items-center justify-between gap-2">
          <h2 className="!text-lg">{title}</h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed border-ink-600 p-6 text-center text-sm text-parch-500">{children}</p>;
}
export function Notice({ kind, children }: { kind: "ok" | "erro" | "info"; children: ReactNode }) {
  const c = kind === "ok" ? "border-emerald-600/60 text-emerald-300" : kind === "erro" ? "border-wine-400 text-red-300" : "border-arcane-500 text-arcane-400";
  return <p role={kind === "erro" ? "alert" : "status"} className={`rounded-md border bg-ink-900 px-3 py-2 text-sm ${c}`}>{kind === "erro" ? "⚠ " : kind === "ok" ? "✓ " : "ℹ "}{children}</p>;
}
const STATUS: Record<string, string> = {
  pendente: "border-amber-500 text-amber-300", ativa: "border-emerald-500 text-emerald-300",
  inativa: "border-parch-500 text-parch-300", morta: "border-wine-400 text-red-300",
  draft: "border-amber-500 text-amber-300", published: "border-emerald-500 text-emerald-300", archived: "border-parch-500 text-parch-300",
};
const STATUS_ICON: Record<string, string> = { pendente: "⏳", ativa: "●", inativa: "○", morta: "✝", draft: "✎", published: "✓", archived: "▣" };
const STATUS_LABEL: Record<string, string> = { draft: "Rascunho", published: "Publicado", archived: "Arquivado" };
export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS[status] ?? ""}`}>{STATUS_ICON[status]} {STATUS_LABEL[status] ?? status[0].toUpperCase() + status.slice(1)}</span>;
}
/** Barra de recurso: não depende só de cor (mostra números e rótulo de estado). */
export function Bar({ label, current, max, tone }: { label: string; current: number | null; max: number | null; tone: "hp" | "mana" }) {
  if (max === null || current === null) return <p className="text-sm text-parch-500">{label}: — <span className="text-xs">(a raça não possui)</span></p>;
  const pct = max === 0 ? 0 : Math.max(0, Math.min(100, (current / max) * 100));
  const low = pct <= 25;
  const fill = tone === "hp" ? "bg-wine-400" : "bg-arcane-500";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-parch-300">{label}</span>
        <span className="font-semibold tabular-nums">{current} / {max}{low && <span className="ml-2 badge border-wine-400 text-red-300">baixa</span>}</span>
      </div>
      <div className="h-3 overflow-hidden rounded bg-ink-900 ring-1 ring-ink-600" role="progressbar" aria-label={label} aria-valuenow={current} aria-valuemin={0} aria-valuemax={max}>
        <div className={`h-full ${fill} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl">{children}</h1>
      {sub && <p className="mt-1 text-sm text-parch-500">{sub}</p>}
      <div className="divider" />
    </header>
  );
}
export function SearchForm({ q, placeholder = "Pesquisar…" }: { q?: string; placeholder?: string }) {
  return (
    <form className="mb-4 flex gap-2" role="search">
      <input className="input" type="search" name="q" defaultValue={q} placeholder={placeholder} aria-label="Pesquisar" />
      <button className="btn btn-primary" type="submit">Buscar</button>
    </form>
  );
}
export function TopNav({ links, current }: { links: { href: string; label: string }[]; current?: string }) {
  return (
    <nav aria-label="Navegação" className="flex flex-wrap gap-1">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={current === l.href ? "page" : undefined}
          className={`rounded-md px-3 py-1.5 text-sm no-underline ${current === l.href ? "bg-gold-600/30 text-gold-300" : "text-parch-300 hover:bg-ink-700"}`}>{l.label}</Link>
      ))}
    </nav>
  );
}
