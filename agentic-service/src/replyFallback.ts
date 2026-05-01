import type { IntentParams } from './chat';

function asObj(v: unknown): Record<string, any> | null {
  return v && typeof v === 'object' ? (v as Record<string, any>) : null;
}

function fmtPrice(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 'N/A';
  return `$${n.toFixed(2)}/day`;
}

function productLine(p: any): string {
  const name = p?.name ?? `Product #${p?.id ?? 'N/A'}`;
  const category = p?.category ?? 'UNKNOWN';
  return `${name} (${category}) — ${fmtPrice(p?.pricePerDay)}`;
}

export function buildFallbackReply(params: IntentParams, groundingData: unknown): string {
  if (!groundingData) return 'Grounding data is unavailable right now, so I cannot provide a factual answer.';

  const obj = asObj(groundingData);
  if (!obj) return 'I could not parse grounding data for this request.';
  if (typeof obj.system_note === 'string') return obj.system_note;

  if (params.intent === 'availability' && obj.availability) {
    const a = asObj(obj.availability) ?? {};
    if (a.available === true) return `This item is available from ${a.from} to ${a.to}.`;
    const busy = Array.isArray(a.busyPeriods) ? a.busyPeriods.slice(0, 2) : [];
    const windows = Array.isArray(a.freeWindows) ? a.freeWindows.slice(0, 2) : [];
    return `This item is not fully available in that range. Busy: ${JSON.stringify(busy)}. Free windows: ${JSON.stringify(windows)}.`;
  }

  if (params.intent === 'browse') {
    const matching = Array.isArray(obj.matchingProducts) ? obj.matchingProducts : [];
    if (matching.length === 0) return 'I could not find matching products right now.';
    const top = matching.slice(0, 5).map(productLine).join('; ');
    return `Yes, there are matching products: ${top}.`;
  }

  if (params.intent === 'product_info') {
    const p = asObj(obj.product);
    if (!p) return 'I could not find that product right now.';
    const availability = obj.availability && typeof obj.availability.available === 'boolean'
      ? obj.availability.available
        ? ' It is currently available for the requested range.'
        : ' It is currently not fully available for the requested range.'
      : '';
    return `${productLine(p)}.${availability}`;
  }

  if (params.intent === 'category' && Array.isArray(obj.data)) {
    const top = obj.data[0];
    if (top?.category) return `${top.category} has the highest rental activity in the current category stats.`;
  }

  if (params.intent === 'discount') {
    const score = typeof obj.securityScore === 'number' ? obj.securityScore : null;
    const userId = params.userId ?? obj.id;
    if (score !== null) {
      const discount = score >= 80 ? 15 : score >= 60 ? 10 : score >= 40 ? 5 : 0;
      return `User ${userId} has security score ${score}, estimated discount tier is ${discount}%.`;
    }
    return 'I could not retrieve the user security score right now.';
  }

  if (params.intent === 'trending' && Array.isArray(obj.recommendations)) {
    const items = obj.recommendations.slice(0, 3).map((x: any) => `${x.name} (${x.category})`);
    return items.length ? `Top recommendations: ${items.join(', ')}.` : 'No trending recommendations found for that date.';
  }

  if (params.intent === 'surge' && Array.isArray(obj.data)) {
    const next = obj.data.find((d: any) => d.nextSurgeDate && typeof d.daysUntil === 'number');
    if (next) return `Nearest next surge date is ${next.nextSurgeDate} in ${next.daysUntil} day(s).`;
    return 'No future surge day is available in this month.';
  }

  if (params.intent === 'peak' && obj.peakWindow) {
    const p = obj.peakWindow;
    return `Peak 7-day window is ${p.from} to ${p.to} with ${p.totalRentals} rentals.`;
  }

  return 'I fetched data, but could not format a confident answer from it yet.';
}
