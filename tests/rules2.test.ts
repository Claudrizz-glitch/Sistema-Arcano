import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { featCost } from "../src/domain/feats.ts";
import { BLEED_GRADES, bleedLoss, privationActive, absorptionPerTurn, absorptionTransfer } from "../src/domain/bleeding.ts";
import { calendarDate } from "../src/domain/calendar.ts";
import { effectiveStats, speedMps, massForce, steppedAttribute } from "../src/domain/levels.ts";
import { spellBlock, extrasToGrant, extrasToRevoke } from "../src/domain/eligibility.ts";
import { processRegen } from "../src/domain/time.ts";

const seed = JSON.parse(readFileSync(new URL("../seed/progressions.json", import.meta.url), "utf8"));
const bless = JSON.parse(readFileSync(new URL("../seed/blessings.json", import.meta.url), "utf8"));

/* ---- Tabelas oficiais digitadas do prompt do Mestre (independentes do PDF) ---- */
const dice = (a: string, b: string, c: string): string[] => [...Array(7).fill(a), ...Array(7).fill(b), ...Array(7).fill(c)];
const OFFICIAL: Record<string, { hp: (number | null)[]; mana: (number | null)[]; dice: string[] }> = {
  humano: { hp: [22,26,30,34,38,42,46,50,56,62,68,74,80,88,96,104,112,122,132,142,152], mana: [40,45,50,60,70,80,90,100,115,130,150,170,190,215,240,270,300,340,380,420,460], dice: dice("1d1","1d4","1d10") },
  anao: { hp: [34,40,46,52,58,64,70,76,85,94,103,112,121,133,145,157,169,184,199,214,229], mana: Array(21).fill(null), dice: dice("1d6","4d6","3d20") },
  druida: { hp: [26,31,36,41,46,51,56,61,68,75,82,89,96,105,114,123,132,144,156,168,180], mana: [40,45,50,60,70,80,90,100,115,130,150,170,190,215,240,270,300,340,380,420,460], dice: dice("1d4","4d4","2d20") },
  profano: { hp: [6,8,10,12,14,16,18,20,23,26,29,32,35,40,45,50,55,62,69,76,83], mana: [10,14,18,24,30,36,42,48,57,66,76,86,96,110,124,140,156,175,194,213,232], dice: dice("1d1","1d4","1d10") },
  forjado: { hp: Array(21).fill(null), mana: [22,26,30,34,38,42,46,50,56,62,68,74,80,88,96,104,112,122,132,142,152], dice: dice("1d1","1d4","1d10") },
  druida_puro: { hp: [14,17,20,23,26,29,32,35,40,45,50,55,60,67,74,81,88,97,106,115,124], mana: [60,67,74,89,104,119,134,149,179,209,239,269,299,344,389,434,479,524,569,614,659], dice: dice("1d1","1d4","1d10") },
};
test("tabelas oficiais: todos os 21 níveis de cada raça batem exatamente com o seed", () => {
  for (const [slug, o] of Object.entries(OFFICIAL)) {
    assert.equal(seed[slug].length, 21, slug);
    seed[slug].forEach((r: any, i: number) => {
      assert.equal(r.level, i + 1);
      assert.equal(r.max_hp, o.hp[i], `${slug} vida nv ${i + 1}`);
      assert.equal(r.max_mana, o.mana[i], `${slug} mana nv ${i + 1}`);
      assert.equal(`${r.aa_dice_count}d${r.aa_dice_sides}`, o.dice[i], `${slug} dado nv ${i + 1}`);
    });
  }
});

test("Feitos Mágicos: abaixo da CD o custo sobe proporcionalmente até 2× no 1", () => {
  // CD 11: 11+ → 100 · 10 → 110 · 6 → 150 · 2 → 190 · 1 → 200
  const exp: Record<number, number> = { 20: 100, 11: 100, 10: 110, 6: 150, 2: 190, 1: 200 };
  for (const [roll, cost] of Object.entries(exp)) assert.equal(featCost(100, Number(roll), 0, 11).cost, cost);
  assert.equal(featCost(15, 8, 0, 10).cost, 19); // 15 × 11/9 = 18,33 → 19
  assert.equal(featCost(40, 1, 0, 5).multiplier, 2);
  assert.equal(featCost(40, 1, 5, 5).cost, 80); // 1 no dado é sempre 2×, mesmo com bônus
  assert.equal(featCost(100, 3, 0, null).cost, 100); // sem CD: custo normal
  assert.throws(() => featCost(100, 0)); assert.throws(() => featCost(100, 21));
  assert.equal(featCost(100, 6, 5, 12).cost, 110); // Profano: 6+5 = 11, CD 12 → 100 × 12/11 = 109,1 → 110
});

test("sangramento: % do HP máximo, arredondado para cima, nunca zero", () => {
  const p = (g: number) => BLEED_GRADES.find((x) => x.grade === g)!.percent;
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8].map(p), [1, 2, 3, 4, 5, 10, 15, null]);
  assert.equal(bleedLoss(100, 3), 3); assert.equal(bleedLoss(38, 3), 2); assert.equal(bleedLoss(38, 1), 1);
  assert.equal(BLEED_GRADES[7].lethal, true);
});

test("Forjado: privação só depois de 10 turnos (1 minuto)", () => {
  assert.equal(privationActive(10, 0), false); assert.equal(privationActive(11, 0), true); assert.equal(privationActive(50, null), false);
  assert.equal(bleedLoss(38, 5), 2);
});

test("absorção: 1/s = 6 por turno; 5/s = 30; respeita destino e origem", () => {
  assert.equal(absorptionPerTurn("passiva"), 6); assert.equal(absorptionPerTurn("ativa"), 30);
  assert.equal(absorptionTransfer(30, 18, null), 18); assert.equal(absorptionTransfer(6, 22, 4), 4); assert.equal(absorptionTransfer(6, 0, 10), 0);
});

test("calendário: ano 44, dia 69 do Inverno; Eclipse no 1º da Primavera a cada 22 anos (0, 22, 44…)", () => {
  const d0 = calendarDate(0, 6);
  assert.deepEqual([d0.season, d0.day, d0.year], ["Inverno", 69, 44]);
  assert.deepEqual([d0.eclipse.year, d0.eclipse.daysUntil], [44, 22]);
  const day = 14400; // turnos de 6 s em 1 dia
  assert.deepEqual([calendarDate(21 * day, 6).season, calendarDate(21 * day, 6).day], ["Inverno", 90]);
  const e = calendarDate(22 * day, 6);
  assert.deepEqual([e.season, e.day, e.year, e.eclipse.isToday], ["Primavera", 1, 44, true]);
  const next = calendarDate(23 * day, 6); assert.equal(next.eclipse.year, 66); assert.equal(next.eclipse.daysUntil, 22 * 360 - 1);
  assert.equal(calendarDate((22 + 270) * day, 6).year, 45); // o ano vira no 1º do Inverno
});

test("Velocidade (N=4) e Força de Massa seguem piso((nível−1)/N); nível 0 dobra", () => {
  const v: Record<number, number> = { 1: 1, 4: 1, 5: 2, 8: 2, 9: 3, 12: 3, 13: 4, 16: 4, 17: 5, 20: 5, 21: 6 };
  for (const [l, x] of Object.entries(v)) assert.equal(speedMps(Number(l)), x, `nível ${l}`);
  assert.equal(speedMps(0), 12);
  assert.equal(steppedAttribute(4, 3, 1), 4); assert.equal(steppedAttribute(4, 3, 4), 5); // FM humano: 4 + piso((n−1)/3)
  assert.equal(massForce(0, 4, 3), (4 + 6) * 2);
});

test("nível 0: dobra Vida, Mana e dados do nível 21; sem mana continua sem mana", () => {
  const hum = effectiveStats(seed.humano[20], 0); assert.deepEqual([hum.maxHp, hum.maxMana, hum.aaDice.count, hum.aaDice.sides], [304, 920, 2, 10]);
  const ana = effectiveStats(seed.anao[20], 0); assert.deepEqual([ana.maxHp, ana.maxMana, ana.aaDice.count], [458, null, 6]);
  const forj = effectiveStats(seed.forjado[20], 0); assert.deepEqual([forj.maxHp, forj.maxMana], [null, 304]);
  assert.equal(effectiveStats(seed.humano[20], 21).maxHp, 152);
});

test("elegibilidade racial de feitiços", () => {
  const sp = { druidic: true, harmonic: true, passive: false, name: "Sopro" };
  const ch = (raceSlug: string, progression: string, can = true) => ({ raceSlug, progression, effectiveRaceCanCast: can, effectiveRaceName: raceSlug });
  assert.match(spellBlock(ch("anao", "anao", false), { ...sp, druidic: false, harmonic: null, name: "Égide" })!, /não pode realizar magia/);
  assert.equal(spellBlock(ch("druida", "druida"), sp), null);
  assert.ok(spellBlock(ch("druida", "druida"), { ...sp, harmonic: false }));       // não harmônico: só Druída Puro
  assert.equal(spellBlock(ch("druida", "druida_puro"), { ...sp, harmonic: false }), null);
  assert.equal(spellBlock(ch("humano", "druida_puro"), sp), null);                  // acesso independe da raça original
  assert.ok(spellBlock(ch("humano", "humano"), sp)); assert.ok(spellBlock(ch("forjado", "forjado"), sp)); assert.ok(spellBlock(ch("profano", "profano"), sp));
  assert.ok(spellBlock(ch("humano", "humano"), { druidic: false, harmonic: null, passive: true, name: "Regra" })); // regra passiva não é feitiço
  assert.equal(spellBlock(ch("druida", "druida"), { druidic: false, harmonic: null, passive: false, name: "Égide", category: "Técnica fundamental" }), null); // manipulação de mana
  assert.ok(spellBlock(ch("druida", "druida"), { druidic: false, harmonic: null, passive: false, name: "Lumus", category: "Feitiço geral" }));
  assert.equal(spellBlock(ch("druida", "druida_puro"), { druidic: false, harmonic: null, passive: false, name: "Lumus", category: "Feitiço geral" }), null);
});

test("bênçãos extras automáticas", () => {
  const g = bless.groups;
  assert.deepEqual(extrasToGrant(["A Força", "O Imperador", "O Julgamento"], g), ["O Carro"]);
  assert.deepEqual(extrasToGrant(["A Força", "O Imperador"], g), []);
  assert.deepEqual(extrasToRevoke(["A Força", "O Imperador", "O Carro"], g, ["O Carro"]), ["O Carro"]);
  assert.deepEqual(extrasToRevoke(["A Força", "O Imperador", "O Carro"], g, []), []); // concedida manualmente: não remove
});

test("regeneração 1/turno continua idempotente (regressão)", () => {
  const a = processRegen({ lastRegenTurn: 0, hp: { current: 10, max: 20 }, mana: null }, 3);
  assert.equal(a.state.hp?.current, 13); assert.equal(processRegen(a.state, 3).ticks, 0);
});
