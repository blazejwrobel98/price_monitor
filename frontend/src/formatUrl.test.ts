import { describe, expect, it } from "vitest";
import { formatUrlLabel } from "./formatUrl";

describe("formatUrlLabel", () => {
  it("drops scheme and www", () => {
    expect(formatUrlLabel("https://www.example.com/foo/bar", 99)).toBe("example.com/foo/bar");
  });

  it("truncates long paths", () => {
    const long = "https://shop.example.com/" + "x".repeat(80);
    const out = formatUrlLabel(long, 40);
    expect(out.length).toBeLessThanOrEqual(40);
    expect(out.endsWith("…")).toBe(true);
  });
});
