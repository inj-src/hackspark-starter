import type { Rental } from "../types.js";

export type DateWindow = { start: string; end: string };

const DAY_MS = 24 * 60 * 60 * 1000;

function parseYmd(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

export function validateRange(from: string, to: string): { ok: true; from: Date; to: Date } | { ok: false; error: string } {
  const fromD = parseYmd(from);
  const toD = parseYmd(to);
  if (!fromD || !toD) return { ok: false, error: "from and to must be valid YYYY-MM-DD" };
  if (fromD > toD) return { ok: false, error: "from must be before or equal to to" };
  return { ok: true, from: fromD, to: toD };
}

export function computeAvailability(rentals: Rental[], from: string, to: string) {
  const validated = validateRange(from, to);
  if (!validated.ok) {
    return { error: validated.error };
  }

  const queryStart = validated.from;
  const queryEnd = validated.to;

  const clipped = rentals
    .map((r) => {
      const start = new Date(r.rentalStart);
      const end = new Date(r.rentalEnd);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
      const s = start < queryStart ? queryStart : start;
      const e = end > queryEnd ? queryEnd : end;
      if (s > queryEnd || e < queryStart || s > e) return null;
      return { start: new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())), end: new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate())) };
    })
    .filter((x): x is { start: Date; end: Date } => x !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const merged: { start: Date; end: Date }[] = [];
  for (const period of clipped) {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push(period);
      continue;
    }
    const adjacentOrOverlap = period.start.getTime() <= addDays(last.end, 1).getTime();
    if (adjacentOrOverlap) {
      if (period.end > last.end) last.end = period.end;
    } else {
      merged.push(period);
    }
  }

  const free: { start: Date; end: Date }[] = [];
  let cursor = queryStart;
  for (const busy of merged) {
    if (cursor < busy.start) {
      free.push({ start: cursor, end: addDays(busy.start, -1) });
    }
    const next = addDays(busy.end, 1);
    if (next > cursor) cursor = next;
  }
  if (cursor <= queryEnd) {
    free.push({ start: cursor, end: queryEnd });
  }

  return {
    available: merged.length === 0,
    busyPeriods: merged.map((m) => ({ start: toYmd(m.start), end: toYmd(m.end) })),
    freeWindows: free
      .filter((f) => f.start <= f.end)
      .map((f) => ({ start: toYmd(f.start), end: toYmd(f.end) })),
  };
}
