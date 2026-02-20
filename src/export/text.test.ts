import { describe, expect, it } from "vitest";
import { buildDiffText } from "./text";

describe("buildDiffText", () => {
  it("renders text export with options and sections", () => {
    const output = buildDiffText("same\nold\n", "same\nnew\n", {
      mode: "lines",
      ignoreCase: false,
      ignoreWhitespace: true,
    });

    expect(output).toContain("private-difff text export");
    expect(output).toContain("モード: 行");
    expect(output).toContain("空白無視(行モード): ON");
    expect(output).toContain("[差分]");
    expect(output).toContain("[変更前全文]");
    expect(output).toContain("[変更後全文]");
  });

  it("handles word/char mode labels", () => {
    const words = buildDiffText("a b", "a c", {
      mode: "words",
      ignoreCase: false,
      ignoreWhitespace: false,
    });
    const chars = buildDiffText("ab", "ac", {
      mode: "chars",
      ignoreCase: false,
      ignoreWhitespace: false,
    });

    expect(words).toContain("モード: 単語");
    expect(chars).toContain("モード: 文字");
  });
});
