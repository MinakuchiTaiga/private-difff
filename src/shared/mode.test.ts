import { describe, expect, it } from "vitest";
import { modeLabel } from "./mode";

describe("modeLabel", () => {
  it("returns localized label for each diff mode", () => {
    expect(modeLabel("chars")).toBe("文字");
    expect(modeLabel("words")).toBe("単語");
    expect(modeLabel("lines")).toBe("行");
  });
});
