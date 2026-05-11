export type ChartPoint = { t: number; label: string; price: number };

/** Porównanie po groszach — wiele rekordów w bazie może mieć minimalnie inną reprezentację liczby. */
export function samePriceForChart(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.round(a * 100) === Math.round(b * 100);
}

/** Sąsiednie w czasie odczyty o tej samej cenie → jeden odcinek [początek, koniec] (czytelny wykres). */
export function collapseSamePriceRunsForChart(points: ChartPoint[]): ChartPoint[] {
  if (points.length === 0) return [];
  const out: ChartPoint[] = [];
  let runStart = points[0];
  let runEnd = points[0];
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (samePriceForChart(runEnd.price, p.price)) {
      runEnd = p;
    } else {
      if (runStart === runEnd) out.push(runStart);
      else out.push(runStart, runEnd);
      runStart = p;
      runEnd = p;
    }
  }
  if (runStart === runEnd) out.push(runStart);
  else out.push(runStart, runEnd);
  return out;
}
