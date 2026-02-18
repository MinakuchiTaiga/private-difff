import { describe, expect, it } from "vitest";
import { buildDiffMarkdown } from "./markdown";

describe("buildDiffMarkdown", () => {
  it("creates fenced diff output with add/remove prefixes", () => {
    const result = buildDiffMarkdown("a\nb\n", "a\nc\n", {
      ignoreCase: false,
      ignoreWhitespace: false,
    });

    expect(result.startsWith("```diff")).toBe(true);
    expect(result.includes("-b")).toBe(true);
    expect(result.includes("+c")).toBe(true);
  });
});
