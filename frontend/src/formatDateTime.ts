/**
 * Backend trzyma znaczniki w UTC (timezone-aware w SQLite).
 * JSON może zwrócić ISO z +00:00 / Z albo — w zależności od serializacji — bez sufiksu.
 * Bez jawnej strefy traktujemy string jako UTC, potem wyświetlamy w strefie przeglądarki.
 */
export function parseBackendInstant(iso: string): Date {
  const s = iso.trim();
  if (!s) return new Date(NaN);
  const hasExplicitTz =
    /[zZ]\s*$/.test(s) ||
    /[+-]\d{2}:\d{2}\s*$/.test(s) ||
    /[+-]\d{4}\s*$/.test(s);
  if (hasExplicitTz) {
    return new Date(s);
  }
  if (/^\d{4}-\d{2}-\d{2}[T ]\d/.test(s)) {
    const normalized = s.replace(" ", "T");
    return normalized.endsWith("Z") ? new Date(normalized) : new Date(`${normalized}Z`);
  }
  return new Date(s);
}

/** Etykieta daty/czasu w strefie użytkownika (przeglądarka). */
export function formatLocalDateTime(iso: string | null, locale = "pl-PL"): string {
  if (!iso) return "—";
  const d = parseBackendInstant(iso);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: tz,
    }).format(d);
  } catch {
    return d.toLocaleString(locale);
  }
}
