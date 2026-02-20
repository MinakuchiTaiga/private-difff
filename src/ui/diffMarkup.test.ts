import { describe, expect, it } from "vitest";
import { renderDiffHtml, renderTwoColumnDiffHtml } from "./diffMarkup";

describe("renderDiffHtml", () => {
  it("renders escaped spans for each part kind", () => {
    const html = renderDiffHtml([
      { value: "<same>" },
      { value: "old", removed: true },
      { value: "new", added: true },
    ]);

    expect(html).toContain("&lt;same&gt;");
    expect(html).toContain('class="removed"');
    expect(html).toContain('class="added"');
  });
});

describe("renderTwoColumnDiffHtml", () => {
  it("renders two-column row structure", () => {
    const html = renderTwoColumnDiffHtml(
      [
        {
          left: { kind: "removed", lineNumber: "1", text: "old" },
          right: { kind: "added", lineNumber: "1", text: "new" },
        },
        {
          left: { kind: "same", lineNumber: "", text: "" },
          right: { kind: "empty", lineNumber: "", text: "" },
        },
      ],
      () => "<svg></svg>",
    );

    expect(html).toContain("diff-two-column-head");
    expect(html).toContain("diff-two-column-row");
    expect(html).toContain("old");
    expect(html).toContain("new");
    expect(html).toContain("=");
    expect(html).toContain("·");
  });
});
