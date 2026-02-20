import { describe, expect, it } from "vitest";
import { calculateTextStats, countLines } from "./textStats";

describe("countLines", () => {
  it("counts lines with and without trailing newline", () => {
    expect(countLines("")).toBe(0);
    expect(countLines("a")).toBe(1);
    expect(countLines("a\nb")).toBe(2);
    expect(countLines("a\nb\n")).toBe(2);
  });
});

describe("calculateTextStats", () => {
  it("calculates text statistics consistently", () => {
    const stats = calculateTextStats("a b\nc");
    expect(stats.lines).toBe(2);
    expect(stats.words).toBe(3);
    expect(stats.newlines).toBe(1);
    expect(stats.spaces).toBe(1);
    expect(stats.chars).toBe(3);
    expect(stats.charsWithSpaces).toBe(4);
    expect(stats.charsWithNewlines).toBe(5);
  });
});
