import { describe, expect, it } from "vitest";
import { createDiff } from "./diffEngine";
import { createLineDiff } from "./lineDiff";

describe("createDiff", () => {
  it("creates char diff summary", () => {
    const result = createDiff("abc", "adc", {
      mode: "chars",
      ignoreCase: false,
      ignoreWhitespace: false,
    });

    expect(result.parts.some((part) => part.added)).toBe(true);
    expect(result.parts.some((part) => part.removed)).toBe(true);
    expect(result.summary.addedSegments).toBeGreaterThan(0);
    expect(result.summary.removedSegments).toBeGreaterThan(0);
  });

  it("creates word diff respecting ignoreCase", () => {
    const withoutIgnore = createDiff("Alpha beta", "alpha beta", {
      mode: "words",
      ignoreCase: false,
      ignoreWhitespace: false,
    });
    const withIgnore = createDiff("Alpha beta", "alpha beta", {
      mode: "words",
      ignoreCase: true,
      ignoreWhitespace: false,
    });

    expect(withoutIgnore.summary.removedSegments).toBeGreaterThan(0);
    expect(withIgnore.summary.removedSegments).toBe(0);
  });

  it("creates line diff respecting ignoreWhitespace", () => {
    const withoutIgnore = createDiff("a\n  b\n", "a\nb\n", {
      mode: "lines",
      ignoreCase: false,
      ignoreWhitespace: false,
    });
    const withIgnore = createDiff("a\n  b\n", "a\nb\n", {
      mode: "lines",
      ignoreCase: false,
      ignoreWhitespace: true,
    });

    expect(withoutIgnore.summary.removedSegments).toBeGreaterThan(0);
    expect(withIgnore.summary.removedSegments).toBe(0);
  });
});

describe("createLineDiff", () => {
  it("supports newlineIsToken option", () => {
    const withToken = createLineDiff("a\nb\n", "a\nb", {
      ignoreCase: false,
      ignoreWhitespace: false,
      newlineIsToken: true,
    });
    const withoutToken = createLineDiff("a\nb\n", "a\nb", {
      ignoreCase: false,
      ignoreWhitespace: false,
      newlineIsToken: false,
    });

    expect(withToken.length).toBe(2);
    expect(withoutToken.length).toBe(3);
    expect(withToken[1]?.value).toBe("\n");
  });
});
