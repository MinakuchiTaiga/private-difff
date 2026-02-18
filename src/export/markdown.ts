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
  return `\`\`\`diff\n${safeBody}\n\`\`\``;
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
