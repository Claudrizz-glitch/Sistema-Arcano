import { redirect } from "next/navigation";

// O Gerenciar sistema saiu da campanha: o conteúdo é oficial e fica em Meu painel.
export default function Sistema() { redirect("/painel/sistema"); }
