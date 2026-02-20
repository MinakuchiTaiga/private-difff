import { describe, expect, it } from "vitest";
import { buildPrintableTwoColumnHtml, buildTwoColumnRows } from "./printView";

describe("buildTwoColumnRows", () => {
  it("creates rows for add/remove/same", () => {
    const rows = buildTwoColumnRows("a\nb\nc\n", "a\nx\nc\ny\n", {
      ignoreCase: false,
      ignoreWhitespace: false,
    });

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.left.kind === "same" && row.right.kind === "same")).toBe(true);
    expect(rows.some((row) => row.left.kind === "removed")).toBe(true);
    expect(rows.some((row) => row.right.kind === "added")).toBe(true);
  });

  it("aligns replacement lines with ignore options", () => {
    const rows = buildTwoColumnRows("A\n  keep\n", "a\nkeep\n", {
      ignoreCase: true,
      ignoreWhitespace: true,
    });

    expect(rows[0]?.left.kind).toBe("same");
    expect(rows[0]?.right.kind).toBe("same");
  });
});

describe("buildPrintableTwoColumnHtml", () => {
  it("renders printable html with escaped content", () => {
    const html = buildPrintableTwoColumnHtml("<left>\n", "<right>\n", {
      ignoreCase: false,
      ignoreWhitespace: false,
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("private-difff 印刷ビュー");
    expect(html).toContain("&lt;left&gt;");
    expect(html).toContain("&lt;right&gt;");
  });
});
