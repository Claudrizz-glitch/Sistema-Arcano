import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (<><SiteHeader /><main className="mx-auto max-w-6xl px-4 py-8">{children}</main><SiteFooter /></>);
}
