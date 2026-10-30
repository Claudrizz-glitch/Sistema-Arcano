"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CampaignNav({ base, links }: { base: string; links: [string, string][] }) {
  const path = usePathname();
  return (
    <nav aria-label="Campanha" className="flex flex-wrap gap-1">
      {links.map(([suffix, label]) => {
        const href = base + suffix; const active = suffix === "" ? path === base : path.startsWith(href);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`rounded-md px-3 py-1.5 text-sm no-underline ${active ? "bg-gold-600/30 text-gold-300" : "text-parch-300 hover:bg-ink-700"}`}>{label}</Link>;
      })}
    </nav>
  );
}
