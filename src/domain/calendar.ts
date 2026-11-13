export type CalendarConfig = {
  seasons: string[]; daysPerSeason: number; startSeason: string; startDay: number; startYear: number;
  startSecondsOfDay: number; eclipseEveryYears: number; firstEclipseYear: number; eclipseSeason: string;
};
/** Padrão (decisão do Mestre, 2026-11-14): anos contados desde o Clube de Tarot e a criação da Capital (ano 0).
 *  Grande Eclipse no 1º dia da Primavera dos anos 0, 22, 44… O ano começa no Inverno, então o Eclipse do ano 44 cai no ano 44.
 *  A campanha começa no dia 69 do Inverno do ano 44: faltam 22 dias para o Eclipse. */
export const DEFAULT_CALENDAR: CalendarConfig = {
  seasons: ["Inverno", "Primavera", "Verão", "Outono"], daysPerSeason: 90, startSeason: "Inverno", startDay: 69, startYear: 44,
  startSecondsOfDay: 0, eclipseEveryYears: 22, firstEclipseYear: 0, eclipseSeason: "Primavera",
};
export type FictionalDate = {
  year: number; season: string; seasonIndex: number; day: number; dayOfYear: number; secondsOfDay: number; time: string;
  eclipse: { year: number; daysUntil: number; isToday: boolean };
};
const pad = (n: number) => String(n).padStart(2, "0");
export function calendarDate(turn: number, turnSeconds: number, cfg: CalendarConfig = DEFAULT_CALENDAR): FictionalDate {
  const dps = cfg.daysPerSeason; const yearLen = cfg.seasons.length * dps;
  const startIdx = cfg.seasons.indexOf(cfg.startSeason) * dps + (cfg.startDay - 1);
  const total = cfg.startSecondsOfDay + turn * turnSeconds;
  const abs = startIdx + Math.floor(total / 86400); const sod = total % 86400;
  const year = cfg.startYear + Math.floor(abs / yearLen); const inYear = abs % yearLen; const si = Math.floor(inYear / dps);
  const eOff = Math.max(0, cfg.seasons.indexOf(cfg.eclipseSeason)) * dps;
  const k = Math.max(0, Math.ceil(((abs - eOff) / yearLen + cfg.startYear - cfg.firstEclipseYear) / cfg.eclipseEveryYears));
  const eYear = cfg.firstEclipseYear + k * cfg.eclipseEveryYears; const eAbs = (eYear - cfg.startYear) * yearLen + eOff;
  return { year, season: cfg.seasons[si], seasonIndex: si, day: (inYear % dps) + 1, dayOfYear: inYear + 1, secondsOfDay: sod,
    time: `${pad(Math.floor(sod / 3600))}:${pad(Math.floor((sod % 3600) / 60))}:${pad(sod % 60)}`, eclipse: { year: eYear, daysUntil: eAbs - abs, isToday: eAbs === abs } };
}
export function configFromJson(j: Record<string, any> | null | undefined): CalendarConfig {
  if (!j || !j.seasons) return DEFAULT_CALENDAR;
  return { seasons: j.seasons, daysPerSeason: j.days_per_season, startSeason: j.start.season, startDay: j.start.day, startYear: j.start.year,
    startSecondsOfDay: j.start_seconds_of_day ?? 0, eclipseEveryYears: j.eclipse_every_years, firstEclipseYear: j.first_eclipse_year,
    eclipseSeason: j.eclipse_season ?? j.seasons[0] };
}

/** Índice absoluto de dia (0 = 1º dia da Primavera do ano 1) e o inverso — usados pelo diário por dia. */
export function absDay(year: number, seasonIndex: number, day: number, cfg: CalendarConfig = DEFAULT_CALENDAR): number {
  return (year - 1) * cfg.seasons.length * cfg.daysPerSeason + seasonIndex * cfg.daysPerSeason + (day - 1);
}
export type DayRef = { year: number; seasonIndex: number; season: string; day: number; abs: number };
export function dayFromAbs(abs: number, cfg: CalendarConfig = DEFAULT_CALENDAR): DayRef {
  const yearLen = cfg.seasons.length * cfg.daysPerSeason; const inYear = abs % yearLen; const si = Math.floor(inYear / cfg.daysPerSeason);
  return { year: 1 + Math.floor(abs / yearLen), seasonIndex: si, season: cfg.seasons[si], day: (inYear % cfg.daysPerSeason) + 1, abs };
}
/** Dias da campanha, do dia de início até a data atual (inclusive). */
export function campaignDays(turn: number, turnSeconds: number, cfg: CalendarConfig = DEFAULT_CALENDAR): DayRef[] {
  const start = absDay(cfg.startYear, cfg.seasons.indexOf(cfg.startSeason), cfg.startDay, cfg);
  const now = calendarDate(turn, turnSeconds, cfg); const end = absDay(now.year, now.seasonIndex, now.day, cfg);
  const out: DayRef[] = []; for (let a = start; a <= end; a++) out.push(dayFromAbs(a, cfg));
  return out;
}
