import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "entrar" };
export default function Page() {
  return (<main className="mx-auto max-w-6xl px-4 py-8"><p><Link href="/">← Arkhavel</Link></p><Suspense><AuthForm mode="entrar" /></Suspense></main>);
}
