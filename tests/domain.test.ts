import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseDice, scaleDiceCount, formatDice } from "../src/domain/dice.ts";
import { getRow, aaDice, xpRequired, xpDrop, initialResources, previewLevelChange } from "../src/domain/progression.ts";
import type { ProgressionTable } from "../src/domain/progression.ts";
import { effectiveMaxHp, effectiveAaDice, manaBlocked } from "../src/domain/modifiers.ts";
import { rollWeaponDamage } from "../src/domain/combat.ts";
import { applyDamage, restore, spendMana } from "../src/domain/resources.ts";
import { processRegen, advanceTurn, DEFAULT_REGEN } from "../src/domain/time.ts";
import { canCreateSheet, checkTransition } from "../src/domain/sheets.ts";
import { blessingRights, canGrantCommon, eligibleExtras } from "../src/domain/blessings.ts";
import type { BlessingRules } from "../src/domain/blessings.ts";
import { massForce, speedMps, metersPerTurn } from "../src/domain/attributes.ts";

const raw = JSON.parse(readFileSync(new URL("../seed/progressions.json", import.meta.url), "utf8"));
const T = (slug: string): ProgressionTable => ({ slug, rows: raw[slug] });
const bless: BlessingRules = JSON.parse(readFileSync(new URL("../seed/blessings.json", import.meta.url), "utf8"));
const fixed = (v: number) => () => v; // rng determinístico

test("critério fundamental: Anão nível 5 = Vida 58, sem Mana, AA 1d6", () => {
  const r = getRow(T("anao"), 5);
  assert.equal(r.max_hp, 58);
  assert.equal(r.max_mana, null);
  assert.equal(formatDice(aaDice(r)), "1d6");
  assert.deepEqual(initialResources(r), { hp: 58, mana: null, sanity: 30 });
});

test("as 6 tabelas têm 21 níveis cada", () => {
  for (const k of Object.keys(raw)) assert.equal(raw[k].length, 21, k);
});

test("fichas de referência batem com as tabelas (máximos e AA)", () => {
  const cases: [string, number, number | null, number | null, string][] = [
    ["humano", 5, 38, 70, "1d1"], // Jorge
    ["profano", 5, 14, 30, "1d1"], // Barbosa / Rumpelstiltskin
    ["druida_puro", 5, 26, 104, "1d1"], // Maxssimus
    ["anao", 6, 64, null, "1d6"], // Adamastor (base, sem Filho do Sol)
  ];
  for (const [slug, lvl, hp, mana, dice] of cases) {
    const r = getRow(T(slug), lvl);
    assert.equal(r.max_hp, hp, `${slug} hp`);
    assert.equal(r.max_mana, mana, `${slug} mana`);
    assert.equal(formatDice(aaDice(r)), dice, `${slug} aa`);
  }
});

test("Adamastor com Filho do Sol: Vida 128, AA 2d6, sem Mana", () => {
  const r = getRow(T("anao"), 6);
  const mods = [{ source: "Filho do Sol", hpMultiplier: 2, aaDiceCountMultiplier: 2, blocksMana: true }];
  assert.equal(effectiveMaxHp(r.max_hp, mods), 128);
  assert.equal(formatDice(effectiveAaDice(aaDice(r), mods)), "2d6");
  assert.equal(manaBlocked(mods), true);
});

test("Forjado não tem Vida; Anão não tem Mana", () => {
  assert.equal(getRow(T("forjado"), 5).max_hp, null);
  assert.equal(getRow(T("forjado"), 5).max_mana, 38);
  assert.equal(getRow(T("anao"), 21).max_mana, null);
});

test("nível inexistente falha em vez de inventar valor", () => {
  assert.throws(() => getRow(T("humano"), 22));
  assert.throws(() => getRow(T("humano"), 0));
});

test("XP: 50 × nível; drop 20×nível + 25×2^(per−1)", () => {
  assert.equal(xpRequired(6), 300);
  assert.equal(xpRequired(5), 250);
  assert.equal(xpDrop(5, 1), 125);
  assert.equal(xpDrop(5, 4), 300);
  assert.throws(() => xpDrop(5, 0));
});

test("N × AA = rola o AA N vezes e soma", () => {
  // Lança do Jorge: 1d6 + 3AA(1d1) + 20 ; rng fixo 0.5 -> d6=4
  const jorge = rollWeaponDamage({ weaponDice: parseDice("1d6"), aaMultiplier: 3, penetration: 20 }, parseDice("1d1"), fixed(0.5));
  assert.deepEqual(jorge, { weapon: 4, aa: 3, penetration: 20, total: 27 });
  // Machado do Adamastor: 1d10 + 4×(2d6) = 1d10 + 8d6
  assert.equal(formatDice(scaleDiceCount(parseDice("2d6"), 4)), "8d6");
  const adam = rollWeaponDamage({ weaponDice: parseDice("1d10"), aaMultiplier: 4, penetration: 0 }, parseDice("2d6"), fixed(0.999));
  assert.equal(adam.total, 10 + 48);
});

test("mudança de nível preserva atuais e só limita ao novo máximo", () => {
  const up = previewLevelChange(T("humano"), 5, 6, { hp: 15, mana: 55, sanity: 10 });
  assert.deepEqual(up.current, { hp: 15, mana: 55, sanity: 10 }); // sem restaurar
  assert.deepEqual(up.max.hp, [38, 42]);
  const down = previewLevelChange(T("humano"), 6, 5, { hp: 42, mana: 80, sanity: 30 });
  assert.deepEqual(down.current, { hp: 38, mana: 70, sanity: 30 });
  assert.deepEqual(down.clamped, { hp: true, mana: true });
});

test("dano, cura e mana", () => {
  assert.deepEqual(applyDamage({ current: 15, max: 38 }, 30), { current: 0, applied: 15 });
  assert.deepEqual(restore({ current: 15, max: 22 }, 10), { current: 22, applied: 7 });
  assert.throws(() => applyDamage({ current: 10, max: 10 }, -1));
  assert.deepEqual(spendMana(40, 8), { ok: true, before: 40, after: 32 });
  assert.deepEqual(spendMana(5, 8), { ok: false, reason: "mana_insuficiente" });
  assert.deepEqual(spendMana(40, null), { ok: false, reason: "custo_ausente" });
  assert.deepEqual(spendMana(40, 8, true), { ok: false, reason: "mana_bloqueada" });
});

test("regeneração: 1/turno, limitada ao máximo e idempotente", () => {
  const s = { lastRegenTurn: 10, hp: { current: 15, max: 38 }, mana: { current: 55, max: 70 } };
  const a = processRegen(s, 13, DEFAULT_REGEN);
  assert.equal(a.ticks, 3);
  assert.equal(a.state.hp?.current, 18);
  assert.equal(a.state.mana?.current, 58);
  const b = processRegen(a.state, 13, DEFAULT_REGEN); // repetido
  assert.equal(b.ticks, 0);
  assert.deepEqual(b.state, a.state);
  const cap = processRegen({ lastRegenTurn: 0, hp: { current: 37, max: 38 }, mana: null }, 100);
  assert.equal(cap.state.hp?.current, 38);
  assert.equal(cap.state.mana, null); // Anão: sem mana
});

test("regeneração configurável (intervalo de 5 turnos) só no limite", () => {
  const rule = { intervalTurns: 5, hp: 1, mana: 1 };
  const s = { lastRegenTurn: 0, hp: { current: 1, max: 10 }, mana: null };
  assert.equal(processRegen(s, 4, rule).ticks, 0);
  const r = processRegen(s, 12, rule);
  assert.equal(r.ticks, 2);
  assert.equal(r.state.lastRegenTurn, 10);
  assert.equal(r.state.hp?.current, 3);
});

test("avanço de turno recusa clique duplicado", () => {
  assert.equal(advanceTurn(7, 7), 8);
  assert.throws(() => advanceTurn(8, 7));
});

test("limite de 10 fichas e ficha ativa única", () => {
  assert.equal(canCreateSheet(9), true);
  assert.equal(canCreateSheet(10), false);
  assert.deepEqual(checkTransition("pendente", "ativa", 0), { ok: true });
  assert.deepEqual(checkTransition("pendente", "ativa", 1), { ok: false, reason: "ja_existe_ficha_ativa" });
  assert.deepEqual(checkTransition("morta", "ativa", 0), { ok: false, reason: "transicao_invalida" });
  assert.deepEqual(checkTransition("ativa", "inativa", 0), { ok: true });
});

test("bênçãos: 22 no total, 6 extras, direitos por nível, extra fora do limite", () => {
  const all = bless.groups.flatMap((g) => [...g.common, g.extra]);
  assert.equal(all.length, 22);
  assert.equal(new Set(all).size, 22);
  assert.equal(bless.groups.length, 6);
  assert.equal(blessingRights(2, bless), 0);
  assert.equal(blessingRights(5, bless), 2);
  assert.equal(blessingRights(6, bless), 2); // Adamastor
  assert.equal(blessingRights(21, bless), 5);
  assert.equal(canGrantCommon(6, ["A Força"], bless), true);
  assert.equal(canGrantCommon(6, ["A Força", "O Sol"], bless), false);
  assert.deepEqual(eligibleExtras(["A Força", "O Imperador", "O Julgamento"], bless), ["O Carro"]);
  assert.deepEqual(eligibleExtras(["A Força"], bless), []);
});

test("Força de Massa e Velocidade (NÃO CONFIRMADOS): lacuna não vira valor", () => {
  assert.equal(massForce("humano", 5), 5); // 4 + floor(4/3)
  assert.equal(massForce("profano", 5), 2); // 1 + floor(4/4)
  assert.equal(massForce("forjado", 5), 5); // proporcional ao Humano (decisão do Mestre)
  assert.equal(massForce("druida_puro", 6), 5); // 4 + floor(5/3)
  assert.equal(massForce("desconhecida", 5), null); // lacuna nunca vira valor
  assert.equal(speedMps(5), 2);
  assert.equal(metersPerTurn(5), 12); // 2 m/s x turno de 6 s
});
