import { describe, expect, it } from "vitest";
import { buildDiffHtml } from "./html";

describe("buildDiffHtml", () => {
  it("renders escaped diff into standalone html", () => {
    const output = buildDiffHtml("<a>\nold\n", "<a>\nnew\n", {
      mode: "lines",
      ignoreCase: false,
      ignoreWhitespace: false,
    });

    expect(output).toContain("<!doctype html>");
    expect(output).toContain("private-difff HTML export");
    expect(output).toContain("&lt;a&gt;");
    expect(output).toContain('class="removed"');
    expect(output).toContain('class="added"');
  });
});
