/**
 * Tekst do wyświetlenia zamiast pełnego URL (bez schematu, max długość).
 * Pełny adres zostaw w `href` / `title`.
 */
export function formatUrlLabel(url: string, maxChars = 48): string {
  const raw = url.trim();
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./i, "");
    const path = u.pathname === "/" ? "" : u.pathname;
    const combined = `${host}${path}${u.search}${u.hash}`;
    if (combined.length <= maxChars) return combined;
    return `${combined.slice(0, Math.max(1, maxChars - 1))}…`;
  } catch {
    if (raw.length <= maxChars) return raw;
    return `${raw.slice(0, Math.max(1, maxChars - 1))}…`;
  }
}
