export function isTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function isCacheOnlyMode(): boolean {
  return isTruthy(process.env.RENTAL_CACHE_ONLY);
}
