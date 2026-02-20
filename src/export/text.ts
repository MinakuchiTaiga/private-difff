import { type DiffMode, createDiff } from "../diff/diffEngine";
import { modeLabel } from "../shared/mode";

export type TextExportOptions = {
  mode: DiffMode;
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
};

export function buildDiffText(
  leftText: string,
  rightText: string,
  options: TextExportOptions,
): string {
  const diff = createDiff(leftText, rightText, options);
  const generatedAt = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date());

  const diffLines: string[] = [];
  for (const part of diff.parts) {
    const prefix = part.added ? "+ " : part.removed ? "- " : "  ";
    const lines = splitLines(part.value);
    for (const line of lines) {
      diffLines.push(`${prefix}${line}`);
    }
  }

  return [
    "private-difff text export",
    `生成日時: ${generatedAt}`,
    `モード: ${modeLabel(options.mode)}`,
    `大文字小文字無視: ${options.ignoreCase ? "ON" : "OFF"}`,
    `空白無視(行モード): ${options.ignoreWhitespace ? "ON" : "OFF"}`,
    "",
    "[差分]",
    diffLines.length > 0 ? diffLines.join("\n") : "  ",
    "",
    "[変更前全文]",
    leftText.length > 0 ? leftText : "",
    "",
    "[変更後全文]",
    rightText.length > 0 ? rightText : "",
  ].join("\n");
}

function splitLines(value: string): string[] {
  if (value.length === 0) {
    return [""];
  }
  const lines = value.split("\n");
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines.length > 0 ? lines : [""];
}
