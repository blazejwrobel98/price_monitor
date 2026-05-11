import { describe, expect, it } from "vitest";
import { collapseSamePriceRunsForChart, type ChartPoint } from "./chartCollapse";

describe("collapseSamePriceRunsForChart", () => {
  it("skraca 13 identycznych cen do dwóch punktów (początek i koniec odcinka)", () => {
    const base: ChartPoint = { t: 1, label: "a", price: 99.99 };
    const pts: ChartPoint[] = Array.from({ length: 13 }, (_, i) => ({
      ...base,
      t: 1000 + i * 60_000,
      label: `t${i}`,
    }));
    const out = collapseSamePriceRunsForChart(pts);
    expect(out).toHaveLength(2);
    expect(out[0].t).toBe(1000);
    expect(out[1].t).toBe(1000 + 12 * 60_000);
    expect(out[0].price).toBe(99.99);
    expect(out[1].price).toBe(99.99);
  });

  it("rozdziela różne ceny", () => {
    const pts: ChartPoint[] = [
      { t: 1, label: "a", price: 10 },
      { t: 2, label: "b", price: 10 },
      { t: 3, label: "c", price: 20 },
      { t: 4, label: "d", price: 20 },
    ];
    expect(collapseSamePriceRunsForChart(pts)).toHaveLength(4);
  });
});
