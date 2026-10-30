import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Markdown } from "@/components/Markdown";
import { PageTitle } from "@/components/ui";
import type { Topic } from "@/lib/types";

export default async function Topico({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb.from("rule_topics").select("*").is("campaign_id", null).eq("status", "published").eq("slug", slug).maybeSingle();
  if (!data) notFound();
  const t = data as Topic;
  return (<><PageTitle>{t.title}</PageTitle><article><Markdown source={t.body_md} /></article><p className="mt-6"><Link href="/regras">← Todas as regras</Link></p></>);
}
