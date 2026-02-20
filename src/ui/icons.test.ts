import { describe, expect, it } from "vitest";
import { hydrateStaticIcons, icon } from "./icons";

describe("icon", () => {
  it("returns svg markup for all supported icon names", () => {
    const names = [
      "lock",
      "chip",
      "github",
      "help",
      "compass",
      "type",
      "align",
      "bolt",
      "fileCode",
      "printer",
      "file",
      "folder",
      "split",
      "layout",
      "settings",
      "plus",
      "minus",
      "equal",
      "trash",
    ] as const;

    for (const name of names) {
      expect(icon(name)).toContain("<svg");
    }

    expect(icon("plus")).toContain("M12 5v14");
  });
});

describe("hydrateStaticIcons", () => {
  it("hydrates only elements with known icon names", () => {
    const withIcon = { dataset: { icon: "plus" }, innerHTML: "" } as unknown as HTMLElement;
    const withoutIcon = { dataset: {}, innerHTML: "keep" } as unknown as HTMLElement;
    const root = {
      querySelectorAll: () => [withIcon, withoutIcon],
    } as unknown as HTMLElement;

    hydrateStaticIcons(root);

    expect(withIcon.innerHTML).toContain("<svg");
    expect(withoutIcon.innerHTML).toBe("keep");
  });
});
