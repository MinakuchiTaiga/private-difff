import type { DiffMode } from "../diff/diffEngine";

export function modeLabel(mode: DiffMode): "文字" | "単語" | "行" {
  if (mode === "chars") {
    return "文字";
  }
  if (mode === "words") {
    return "単語";
  }
  return "行";
}
