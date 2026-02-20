import { describe, expect, it } from "vitest";
import { query } from "./dom";

describe("query", () => {
  it("returns element when found", () => {
    const element = { id: "x" } as unknown as HTMLElement;
    const scope = {
      querySelector: (selector: string) => (selector === "#x" ? element : null),
    } as unknown as ParentNode;

    expect(query<HTMLElement>("#x", scope)).toBe(element);
  });

  it("throws when element is missing", () => {
    const scope = {
      querySelector: () => null,
    } as unknown as ParentNode;

    expect(() => query<HTMLElement>("#missing", scope)).toThrow("Element not found: #missing");
  });
});
