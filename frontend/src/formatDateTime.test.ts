import { describe, expect, it } from "vitest";
import { formatLocalDateTime, parseBackendInstant } from "./formatDateTime";

describe("parseBackendInstant", () => {
  it("traktuje brak strefy jako UTC", () => {
    expect(parseBackendInstant("2026-06-01T15:00:00").toISOString()).toBe(
      "2026-06-01T15:00:00.000Z",
    );
  });

  it("zachowuje sufiks Z", () => {
    expect(parseBackendInstant("2026-06-01T15:00:00.000Z").toISOString()).toBe(
      "2026-06-01T15:00:00.000Z",
    );
  });

  it("szanuje jawny offset", () => {
    expect(parseBackendInstant("2026-06-01T16:00:00+02:00").toISOString()).toBe(
      "2026-06-01T14:00:00.000Z",
    );
  });
});

describe("formatLocalDateTime", () => {
  it("zwraca — dla null", () => {
    expect(formatLocalDateTime(null)).toBe("—");
  });

  it("formatuje poprawny ISO (nie pusty string)", () => {
    const out = formatLocalDateTime("2026-06-01T12:00:00Z");
    expect(out.length).toBeGreaterThan(4);
  });
});
