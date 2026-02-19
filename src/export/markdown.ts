import { diffLines } from "diff";

export type MarkdownExportOptions = {
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
};

export function buildDiffMarkdown(
  leftText: string,
  rightText: string,
  options: MarkdownExportOptions,
): string {
  const generatedAt = formatGeneratedAt(new Date());
  const changes = diffLines(leftText, rightText, {
    ignoreCase: options.ignoreCase,
    ignoreWhitespace: options.ignoreWhitespace,
    newlineIsToken: true,
  });

  const bodyLines: string[] = [];

  for (const part of changes) {
    const prefix = part.added ? "+" : part.removed ? "-" : " ";
    const lines = splitKeepingContent(part.value);
    for (const line of lines) {
      bodyLines.push(`${prefix}${line}`);
    }
  }

  const safeBody = bodyLines.length > 0 ? bodyLines.join("\n") : " ";
  return [
    "```diff",
    safeBody,
    "```",
    "",
    "## 変更前全文",
    "```text",
    leftText.length > 0 ? leftText : " ",
    "```",
    "",
    "## 変更後全文",
    "```text",
    rightText.length > 0 ? rightText : " ",
    "```",
    "",
    "---",
    `生成日時: ${generatedAt}`,
  ].join("\n");
}

function splitKeepingContent(value: string): string[] {
  if (value.length === 0) {
    return [""];
  }

  const raw = value.split("\n");
  if (raw[raw.length - 1] === "") {
    raw.pop();
  }
  return raw.length > 0 ? raw : [""];
}

function formatGeneratedAt(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}
