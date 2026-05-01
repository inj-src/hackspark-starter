const DAY_MS = 24 * 60 * 60 * 1000;

export const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toUtcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function daysBetweenInclusive(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

export function daysInMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

export function parseMonth(month: string): { ok: true; year: number; month: number } | { ok: false; error: string } {
  if (!monthRegex.test(month)) return { ok: false, error: "month must be valid YYYY-MM" };
  const [yearStr, monthStr] = month.split("-");
  return { ok: true, year: Number(yearStr), month: Number(monthStr) };
}
