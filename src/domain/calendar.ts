export type CalendarConfig = {
  seasons: string[]; daysPerSeason: number; startSeason: string; startDay: number; startYear: number;
  startSecondsOfDay: number; eclipseEveryYears: number; firstEclipseYear: number;
};
/** Padrão da campanha: começa no dia 68 do Inverno; 4 estações de 90 dias; Grande Eclipse a cada 22 anos no 1º dia da primavera.
 *  O número do ano inicial (1) e do primeiro eclipse (2) são marcadores configuráveis — o documento não os define. */
export const DEFAULT_CALENDAR: CalendarConfig = {
  seasons: ["Primavera", "Verão", "Outono", "Inverno"], daysPerSeason: 90, startSeason: "Inverno", startDay: 68, startYear: 1,
  startSecondsOfDay: 0, eclipseEveryYears: 22, firstEclipseYear: 2,
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
  const k = Math.max(0, Math.ceil((abs / yearLen + cfg.startYear - cfg.firstEclipseYear) / cfg.eclipseEveryYears));
  const eYear = cfg.firstEclipseYear + k * cfg.eclipseEveryYears; const eAbs = (eYear - cfg.startYear) * yearLen;
  return { year, season: cfg.seasons[si], seasonIndex: si, day: (inYear % dps) + 1, dayOfYear: inYear + 1, secondsOfDay: sod,
    time: `${pad(Math.floor(sod / 3600))}:${pad(Math.floor((sod % 3600) / 60))}:${pad(sod % 60)}`, eclipse: { year: eYear, daysUntil: eAbs - abs, isToday: eAbs === abs } };
}
export function configFromJson(j: Record<string, any> | null | undefined): CalendarConfig {
  if (!j || !j.seasons) return DEFAULT_CALENDAR;
  return { seasons: j.seasons, daysPerSeason: j.days_per_season, startSeason: j.start.season, startDay: j.start.day, startYear: j.start.year,
    startSecondsOfDay: j.start_seconds_of_day ?? 0, eclipseEveryYears: j.eclipse_every_years, firstEclipseYear: j.first_eclipse_year };
}
