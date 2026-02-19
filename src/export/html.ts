import { type DiffMode, createDiff } from "../diff/diffEngine";

export type HtmlExportOptions = {
  mode: DiffMode;
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
};

export function buildDiffHtml(
  leftText: string,
  rightText: string,
  options: HtmlExportOptions,
): string {
  const diff = createDiff(leftText, rightText, options);
  const generatedAt = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date());

  const body = diff.parts
    .map((part) => {
      const cls = part.added ? "added" : part.removed ? "removed" : "same";
      return `<span class="${cls}">${escapeHtml(part.value)}</span>`;
    })
    .join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>private-difff HTML export</title>
    <style>
      :root {
        color-scheme: light;
      }
      body {
        margin: 0;
        padding: 24px;
        font-family: "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
        background: #fffdf7;
        color: #2a241a;
      }
      h1 {
        margin: 0 0 6px;
        font-size: 1.5rem;
      }
      p {
        margin: 0 0 14px;
        font-size: 0.92rem;
      }
      pre {
        margin: 0;
        padding: 14px;
        border: 1px solid #e6d7bd;
        border-radius: 10px;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: "IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, monospace;
        background: #ffffff;
      }
      .added {
        background: #dff4dd;
        color: #124d17;
      }
      .removed {
        background: #fde3df;
        color: #7b1d22;
        text-decoration: line-through;
      }
      .same {
        color: #38322a;
      }
    </style>
  </head>
  <body>
    <h1>private-difff HTML export</h1>
    <p>生成日時: ${generatedAt} / モード: ${modeLabel(options.mode)}</p>
    <pre>${body}</pre>
  </body>
</html>`;
}

function modeLabel(mode: DiffMode): string {
  if (mode === "chars") {
    return "文字";
  }
  if (mode === "words") {
    return "単語";
  }
  return "行";
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
