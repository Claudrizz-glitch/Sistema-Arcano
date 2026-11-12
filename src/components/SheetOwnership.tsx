"use client";
import { Msg, useRpc } from "./client";
import type { Sheet } from "@/lib/types";

export type PlayerOption = { id: string; name: string; sheets: number };

/** Mestre: reservar a ficha como ficha de jogador, importá-la para a conta de um jogador ou devolvê-la ao Mestre. */
export function SheetOwnership({ sheet, players, limit, ownerName }: { sheet: Sheet; players: PlayerOption[]; limit: number; ownerName: string | null }) {
  const { run, busy, msg } = useRpc();
  if (sheet.kind === "jogador") {
    return (
      <div className="space-y-2 text-sm">
        <p>Esta ficha pertence a <b className="text-gold-300">{ownerName ?? "um jogador"}</b>.</p>
        <button className="btn" disabled={busy} onClick={async () => {
          if (window.confirm("Devolver esta ficha ao Mestre? O jogador deixa de vê-la; ela volta para as fichas reservadas.")) await run("return_sheet_to_gm", { p_char: sheet.id }, "Ficha devolvida ao Mestre.");
        }}>Devolver ao Mestre</button>
        <Msg m={msg} />
      </div>
    );
  }
  return (
    <div className="space-y-3 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={!!sheet.player_template} disabled={busy}
          onChange={(e) => run("set_player_template", { p_char: sheet.id, p_flag: e.currentTarget.checked }, e.currentTarget.checked ? "Ficha reservada para um jogador." : "Ficha voltou a ser NPC.")} />
        Ficha de jogador reservada (aguardando importação)
      </label>
      {players.length === 0 ? <p className="text-parch-500">Nenhum jogador entrou na campanha ainda. Compartilhe o código de convite em Visão geral.</p> : (
        <form className="flex flex-wrap items-end gap-2" onSubmit={async (e) => {
          e.preventDefault(); const p = String(new FormData(e.currentTarget).get("player") ?? ""); const who = players.find((x) => x.id === p);
          if (!who) return;
          if (window.confirm(`Importar “${sheet.name}” para a conta de ${who.name}? A ficha passa a ser dele e deixa de ser NPC.`)) await run("assign_sheet_to_player", { p_char: sheet.id, p_user: p }, `Ficha importada para ${who.name}.`);
        }}>
          <div><label className="label" htmlFor={`as-${sheet.id}`}>Importar para o jogador</label>
            <select id={`as-${sheet.id}`} name="player" className="input" required defaultValue="">
              <option value="" disabled>Escolha…</option>
              {players.map((p) => <option key={p.id} value={p.id} disabled={p.sheets >= limit}>{p.name} ({p.sheets}/{limit} fichas)</option>)}
            </select></div>
          <button className="btn btn-primary" disabled={busy}>Importar</button>
        </form>)}
      <p className="text-xs text-parch-500">Se o jogador já tiver uma ficha ativa, a importada entra como inativa.</p>
      <Msg m={msg} />
    </div>
  );
}
