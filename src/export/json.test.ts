import { describe, expect, it } from "vitest";
import { buildDiffJson } from "./json";

describe("buildDiffJson", () => {
  it("builds machine readable payload", () => {
    const output = buildDiffJson("left", "right", {
      mode: "chars",
      ignoreCase: true,
      ignoreWhitespace: false,
    });
    const parsed = JSON.parse(output) as {
      app: string;
      options: { mode: string; ignoreCase: boolean; ignoreWhitespace: boolean };
      parts: Array<{ type: string; value: string }>;
    };

    expect(parsed.app).toBe("private-difff");
    expect(parsed.options).toEqual({
      mode: "chars",
      ignoreCase: true,
      ignoreWhitespace: false,
    });
    expect(parsed.parts.length).toBeGreaterThan(0);
  });
});
