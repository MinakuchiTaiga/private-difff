import { type DiffMode, createDiff } from "../diff/diffEngine";

export type JsonExportOptions = {
  mode: DiffMode;
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
};

export function buildDiffJson(
  leftText: string,
  rightText: string,
  options: JsonExportOptions,
): string {
  const diff = createDiff(leftText, rightText, options);
  const payload = {
    app: "private-difff",
    generatedAt: new Date().toISOString(),
    options: {
      mode: options.mode,
      ignoreCase: options.ignoreCase,
      ignoreWhitespace: options.ignoreWhitespace,
    },
    summary: diff.summary,
    parts: diff.parts.map((part) => ({
      type: part.added ? "added" : part.removed ? "removed" : "same",
      value: part.value,
    })),
    leftText,
    rightText,
  };

  return JSON.stringify(payload, null, 2);
}
