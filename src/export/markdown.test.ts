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
    expect(result.includes("## 変更前全文")).toBe(true);
    expect(result.includes("## 変更後全文")).toBe(true);
    expect(result.includes("```text\na\nb\n\n```")).toBe(true);
    expect(result.includes("```text\na\nc\n\n```")).toBe(true);
    expect(result).toMatch(/生成日時:/u);
  });
});
