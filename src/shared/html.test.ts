import { describe, expect, it } from "vitest";
import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  it("escapes special html characters", () => {
    const result = escapeHtml(`<'">&`);
    expect(result).toBe("&lt;&#39;&quot;&gt;&amp;");
  });
});
