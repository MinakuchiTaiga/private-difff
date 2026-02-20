import { describe, expect, it } from "vitest";
import { readTextFile } from "./readTextFile";

describe("readTextFile", () => {
  it("returns empty string when no file is provided", async () => {
    await expect(readTextFile(undefined)).resolves.toBe("");
  });

  it("reads utf-8 text file", async () => {
    const file = new File(["hello\nworld"], "sample.txt", { type: "text/plain" });
    await expect(readTextFile(file)).resolves.toBe("hello\nworld");
  });

  it("accepts text/* mime without extension", async () => {
    const file = new File(["plain"], "README", { type: "text/plain" });
    await expect(readTextFile(file)).resolves.toBe("plain");
  });

  it("accepts whitelisted application mime without extension", async () => {
    const file = new File(['{"a":1}'], "payload", { type: "application/json" });
    await expect(readTextFile(file)).resolves.toBe('{"a":1}');
  });

  it("rejects files over the maximum size", async () => {
    const oversized = {
      name: "big.txt",
      type: "text/plain",
      size: 20 * 1024 * 1024 + 1,
      arrayBuffer: async () => new ArrayBuffer(0),
    } as File;
    await expect(readTextFile(oversized)).rejects.toThrow("ファイルサイズが上限を超えています");
  });

  it("rejects unsupported extension and mime", async () => {
    const file = new File(["plain"], "sample.bin", { type: "application/octet-stream" });
    await expect(readTextFile(file)).rejects.toThrow("対応しているテキストファイル");
  });

  it("rejects likely binary content even if extension looks text", async () => {
    const binary = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const file = new File([binary], "sample.txt", { type: "text/plain" });
    await expect(readTextFile(file)).rejects.toThrow("バイナリファイル");
  });

  it("rejects null-byte binary payload", async () => {
    const binary = new Uint8Array([0, 65, 66, 0, 67, 68, 69, 70]);
    const file = new File([binary], "sample.txt", { type: "text/plain" });
    await expect(readTextFile(file)).rejects.toThrow("バイナリファイル");
  });

  it("handles empty text file", async () => {
    const file = new File([""], "empty.txt", { type: "text/plain" });
    await expect(readTextFile(file)).resolves.toBe("");
  });

  it("decodes utf-16le with BOM", async () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0x41, 0x00, 0x42, 0x00]);
    const file = new File([bytes], "utf16le.txt", { type: "text/plain" });
    await expect(readTextFile(file)).resolves.toContain("AB");
  });

  it("decodes utf-16be with BOM", async () => {
    const bytes = new Uint8Array([0xfe, 0xff, 0x00, 0x41, 0x00, 0x42]);
    const file = new File([bytes], "utf16be.txt", { type: "text/plain" });
    await expect(readTextFile(file)).resolves.toContain("AB");
  });

  it("decodes utf-16le pattern without BOM", async () => {
    const bytes = new Uint8Array([0x41, 0x00, 0x42, 0x00, 0x43, 0x00, 0x44, 0x00]);
    const file = new File([bytes], "utf16-nobom.txt", { type: "text/plain" });
    await expect(readTextFile(file)).resolves.toContain("ABCD");
  });

  it("handles short byte arrays without utf16 heuristic", async () => {
    const bytes = new Uint8Array([0x61, 0x62, 0x63]);
    const file = new File([bytes], "short.txt", { type: "text/plain" });
    await expect(readTextFile(file)).resolves.toBe("abc");
  });
});
