"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Limita a altura de um card grande (padrão 26 rem ≈ 416 px) e mostra "Mostrar tudo" / "Recolher".
 *  Só aparece o botão quando o conteúdo realmente passa do limite; cards pequenos ficam do tamanho do texto. */
export function Collapsible({ children, limit = 416, className = "" }: { children: ReactNode; limit?: number; className?: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const el = inner.current; if (!el) return;
    const measure = () => setOverflow(el.offsetHeight > limit + 24);   // folga: só recolhe se sobrar um pedaço relevante
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, [limit]);
  const clipped = overflow && !open;
  return (
    <div className={className}>
      <div className="relative" style={clipped ? { maxHeight: limit, overflow: "hidden" } : undefined}>
        <div ref={inner}>{children}</div>
        {clipped && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-800 to-transparent" />}
      </div>
      {overflow && (
        <button type="button" className="mt-2 w-full rounded-md border border-ink-600 py-1 text-xs text-gold-300 hover:border-gold-400" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "▴ Recolher" : "▾ Mostrar tudo"}
        </button>
      )}
    </div>
  );
}
