import { describe, expect, it } from "vitest";
import { renderSummaryHtml } from "./summaryMarkup";

describe("renderSummaryHtml", () => {
  it("renders stats and mode-dependent summary label", () => {
    const html = renderSummaryHtml(
      {
        chars: 10,
        spaces: 2,
        charsWithSpaces: 12,
        lines: 2,
        newlines: 1,
        charsWithNewlines: 13,
        words: 3,
      },
      {
        chars: 12,
        spaces: 3,
        charsWithSpaces: 15,
        lines: 3,
        newlines: 2,
        charsWithNewlines: 17,
        words: 4,
      },
      "words",
      {
        addedUnits: 5,
        removedUnits: 2,
        unchangedUnits: 1,
      },
      () => "<svg></svg>",
    );

    expect(html).toContain("変更前");
    expect(html).toContain("変更後");
    expect(html).toContain("5 単語");
    expect(html).toContain("2 単語");
    expect(html).toContain("1 単語");
  });

  it("supports chars/lines unit labels", () => {
    const chars = renderSummaryHtml(
      {
        chars: 1,
        spaces: 0,
        charsWithSpaces: 1,
        lines: 1,
        newlines: 0,
        charsWithNewlines: 1,
        words: 1,
      },
      {
        chars: 1,
        spaces: 0,
        charsWithSpaces: 1,
        lines: 1,
        newlines: 0,
        charsWithNewlines: 1,
        words: 1,
      },
      "chars",
      { addedUnits: 1, removedUnits: 1, unchangedUnits: 1 },
      () => "",
    );
    const lines = renderSummaryHtml(
      {
        chars: 1,
        spaces: 0,
        charsWithSpaces: 1,
        lines: 1,
        newlines: 0,
        charsWithNewlines: 1,
        words: 1,
      },
      {
        chars: 1,
        spaces: 0,
        charsWithSpaces: 1,
        lines: 1,
        newlines: 0,
        charsWithNewlines: 1,
        words: 1,
      },
      "lines",
      { addedUnits: 1, removedUnits: 1, unchangedUnits: 1 },
      () => "",
    );

    expect(chars).toContain("1 文字");
    expect(lines).toContain("1 行");
  });
});
