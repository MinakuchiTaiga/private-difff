import { createLineDiff } from "../diff/lineDiff";
import { escapeHtml } from "../shared/html";
import { calculateTextStats } from "../shared/textStats";

export type PrintOptions = {
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
};

export type RowKind = "same" | "added" | "removed" | "empty";

export type SideRow = {
  lineNumber: string;
  text: string;
  kind: RowKind;
};

export type TwoColumnRow = {
  left: SideRow;
  right: SideRow;
};

export function buildPrintableTwoColumnHtml(
  leftText: string,
  rightText: string,
  options: PrintOptions,
): string {
  const generatedAt = formatGeneratedAt(new Date());
  const rows = buildTwoColumnRows(leftText, rightText, options);
  const leftStats = calculateTextStats(leftText);
  const rightStats = calculateTextStats(rightText);

  const rowsHtml = rows
    .map(
      (row) => `
      <article class="row">
        <section class="pane ${row.left.kind}">
          <div class="gutter">${escapeHtml(row.left.lineNumber || "·")}</div>
          <div class="body">
            <span class="kind">${kindMark(row.left.kind)}</span>
            <pre>${escapeHtml(row.left.text || " ")}</pre>
          </div>
        </section>
        <section class="pane ${row.right.kind}">
          <div class="gutter">${escapeHtml(row.right.lineNumber || "·")}</div>
          <div class="body">
            <span class="kind">${kindMark(row.right.kind)}</span>
            <pre>${escapeHtml(row.right.text || " ")}</pre>
          </div>
        </section>
      </article>
    `,
    )
    .join("\n");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
    />
    <title>差分印刷ビュー</title>
    <style>
      :root {
        --bg: #fafafa;
        --surface: #ffffff;
        --text: #191919;
        --muted: #737373;
        --line: #e6e6e6;
        --good-bg: #edf8ee;
        --good-text: #2d7f3c;
        --bad-bg: #ffecec;
        --bad-text: #a63636;
        --same: #ffffff;
        --added: var(--good-bg);
        --removed: var(--bad-bg);
        --empty: #fafafa;
        --same-accent: #d0d0d0;
        --added-accent: var(--good-text);
        --removed-accent: var(--bad-text);
        --empty-accent: #d6d6d6;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        color: var(--text);
        background: var(--bg);
        font-family: "Avenir Next", "Helvetica Neue", "Noto Sans JP", sans-serif;
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px;
        border-bottom: 1px solid var(--line);
        background: var(--surface);
      }
      h1 {
        margin: 0;
        font-size: 13px;
        letter-spacing: 0.02em;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .print-tip {
        margin: 0;
        font-size: 12px;
        color: var(--muted);
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .header-meta {
        margin: 4px 0 0;
        font-size: 10px;
        color: #8a8a8a;
        text-align: right;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .header-right {
        display: grid;
        justify-items: end;
      }
      main {
        padding: 14px;
        display: grid;
        gap: 12px;
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        font-size: 10px;
        color: var(--muted);
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 3px 9px;
        background: #fff;
      }
      .swatch {
        width: 10px;
        height: 10px;
        border: 1px solid #cfcfcf;
      }
      .swatch.same { background: var(--same); }
      .swatch.added { background: var(--added); }
      .swatch.removed { background: var(--removed); }
      .swatch.empty { background: var(--empty); }
      .cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .stats-card {
        border: 1px solid var(--line);
        background: #fff;
        border-radius: 8px;
        padding: 8px 10px;
      }
      .stats-head {
        margin: 0 0 6px;
        font-size: 11px;
        font-weight: 700;
        color: #4c4c4c;
      }
      .stats-list {
        margin: 0;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 4px 8px;
        font-size: 10px;
      }
      .stats-list dt {
        margin: 0;
        color: #666;
      }
      .stats-list dd {
        margin: 0;
        font-weight: 600;
        color: #262626;
      }
      .col-head {
        padding: 2px 2px 6px;
        font-size: 10px;
        font-weight: 600;
        color: var(--muted);
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .rows {
        display: grid;
        gap: 3px;
        font-family: "IBM Plex Mono", "SFMono-Regular", Menlo, monospace;
        font-size: 11px;
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .pane {
        display: grid;
        grid-template-columns: 3.5ch 1fr;
        min-height: 22px;
      }
      .gutter {
        text-align: right;
        padding: 5px 6px 5px 2px;
        color: #a0a0a0;
        background: transparent;
      }
      .body {
        display: grid;
        grid-template-columns: 12px 1fr;
        align-items: start;
        padding-left: 4px;
      }
      .kind {
        display: inline-flex;
        justify-content: center;
        padding-top: 5px;
        font-weight: 600;
        font-size: 10px;
      }
      pre {
        margin: 0;
        padding: 5px 8px 5px 6px;
        word-break: break-word;
        white-space: pre-wrap;
        line-height: 1.45;
      }
      .pane.same { background: var(--same); box-shadow: inset 2px 0 0 var(--same-accent); }
      .pane.added { background: var(--added); box-shadow: inset 4px 0 0 var(--added-accent); }
      .pane.removed { background: var(--removed); box-shadow: inset 4px 0 0 var(--removed-accent); }
      .pane.empty { background: var(--empty); box-shadow: inset 3px 0 0 var(--empty-accent); color: #b3b3b3; }
      .pane.same .kind { color: var(--same-accent); }
      .pane.added .kind { color: var(--added-accent); }
      .pane.removed .kind { color: var(--removed-accent); }
      .pane.empty .kind { color: var(--empty-accent); }
      .pane.same pre { color: #35342f; }
      .pane.added pre { color: var(--good-text); font-weight: 520; }
      .pane.removed pre { color: var(--bad-text); font-weight: 520; }
      .i { width: 14px; height: 14px; flex: 0 0 14px; }
      @media print {
        .print-tip { display: none; }
        body { background: #fff; }
        .legend { color: #555; }
        @page { size: A4 landscape; margin: 12mm; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>${icon("printer")}private-difff 印刷ビュー</h1>
      <div class="header-right">
        <p class="print-tip">${icon("file")}ブラウザの印刷機能でPDF化してください</p>
        <p class="header-meta">${icon("clock")}生成日時: ${escapeHtml(generatedAt)}</p>
      </div>
    </header>
    <main>
      <section class="legend">
        <span class="pill"><span class="swatch same"></span>同一 (=)</span>
        <span class="pill"><span class="swatch added"></span>追加 (+)</span>
        <span class="pill"><span class="swatch removed"></span>削除 (-)</span>
      </section>
      <section class="stats">
        <article class="stats-card">
          <h2 class="stats-head">変更前テキスト</h2>
          <dl class="stats-list">
            <dt>行数</dt><dd>${leftStats.lines}</dd>
            <dt>単語数</dt><dd>${leftStats.words}</dd>
            <dt>文字数</dt><dd>${leftStats.chars}</dd>
            <dt>文字数（空白込み）</dt><dd>${leftStats.charsWithSpaces}</dd>
            <dt>文字数（空白・改行込み）</dt><dd>${leftStats.charsWithNewlines}</dd>
          </dl>
        </article>
        <article class="stats-card">
          <h2 class="stats-head">変更後テキスト</h2>
          <dl class="stats-list">
            <dt>行数</dt><dd>${rightStats.lines}</dd>
            <dt>単語数</dt><dd>${rightStats.words}</dd>
            <dt>文字数</dt><dd>${rightStats.chars}</dd>
            <dt>文字数（空白込み）</dt><dd>${rightStats.charsWithSpaces}</dd>
            <dt>文字数（空白・改行込み）</dt><dd>${rightStats.charsWithNewlines}</dd>
          </dl>
        </article>
      </section>
      <section class="cols">
        <div class="col-head">${icon("left")}変更前</div>
        <div class="col-head">${icon("right")}変更後</div>
      </section>
      <section class="rows">
        ${rowsHtml}
      </section>
    </main>
  </body>
</html>`;
}

function icon(name: "printer" | "file" | "left" | "right" | "clock"): string {
  const common =
    'class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

  if (name === "printer") {
    return `<svg ${common}><path d="M6 9V4h12v5"/><rect x="6" y="14" width="12" height="7" rx="1"/><path d="M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/></svg>`;
  }
  if (name === "file") {
    return `<svg ${common}><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h6"/></svg>`;
  }
  if (name === "left") {
    return `<svg ${common}><path d="M15 18 9 12l6-6"/><path d="M9 12h11"/></svg>`;
  }
  if (name === "clock") {
    return `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;
  }
  return `<svg ${common}><path d="m9 18 6-6-6-6"/><path d="M15 12H4"/></svg>`;
}

function formatGeneratedAt(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

export function buildTwoColumnRows(
  leftText: string,
  rightText: string,
  options: PrintOptions,
): TwoColumnRow[] {
  const changes = createLineDiff(leftText, rightText, {
    ignoreCase: options.ignoreCase,
    ignoreWhitespace: options.ignoreWhitespace,
    newlineIsToken: true,
  });

  const rows: TwoColumnRow[] = [];
  let leftNo = 1;
  let rightNo = 1;

  for (let index = 0; index < changes.length; index += 1) {
    const current = changes[index];
    const next = changes[index + 1];

    if (current.removed && next?.added) {
      const removedLines = toLines(current.value);
      const addedLines = toLines(next.value);
      const lineChanges = alignReplacementLines(removedLines, addedLines, options);

      for (let innerIndex = 0; innerIndex < lineChanges.length; innerIndex += 1) {
        const lineChange = lineChanges[innerIndex];
        const nextLineChange = lineChanges[innerIndex + 1];

        if (lineChange.type === "removed" && nextLineChange?.type === "added") {
          const leftLine = lineChange.value;
          const rightLine = nextLineChange.value;
          rows.push({
            left: {
              lineNumber: leftLine === undefined ? "" : String(leftNo++),
              text: leftLine ?? "",
              kind: leftLine === undefined ? "empty" : "removed",
            },
            right: {
              lineNumber: rightLine === undefined ? "" : String(rightNo++),
              text: rightLine ?? "",
              kind: rightLine === undefined ? "empty" : "added",
            },
          });
          innerIndex += 1;
          continue;
        }

        if (lineChange.type === "removed") {
          const line = lineChange.value;
          rows.push({
            left: { lineNumber: String(leftNo++), text: line, kind: "removed" },
            right: { lineNumber: "", text: "", kind: "empty" },
          });
          continue;
        }

        if (lineChange.type === "added") {
          const line = lineChange.value;
          rows.push({
            left: { lineNumber: "", text: "", kind: "empty" },
            right: { lineNumber: String(rightNo++), text: line, kind: "added" },
          });
          continue;
        }

        const line = lineChange.value;
        rows.push({
          left: { lineNumber: String(leftNo++), text: line, kind: "same" },
          right: { lineNumber: String(rightNo++), text: line, kind: "same" },
        });
      }

      index += 1;
      continue;
    }

    if (current.added) {
      for (const line of toLines(current.value)) {
        rows.push({
          left: { lineNumber: "", text: "", kind: "empty" },
          right: { lineNumber: String(rightNo++), text: line, kind: "added" },
        });
      }
      continue;
    }

    if (current.removed) {
      for (const line of toLines(current.value)) {
        rows.push({
          left: { lineNumber: String(leftNo++), text: line, kind: "removed" },
          right: { lineNumber: "", text: "", kind: "empty" },
        });
      }
      continue;
    }

    for (const line of toLines(current.value)) {
      rows.push({
        left: { lineNumber: String(leftNo++), text: line, kind: "same" },
        right: { lineNumber: String(rightNo++), text: line, kind: "same" },
      });
    }
  }

  return rows;
}

function toLines(value: string): string[] {
  if (value.length === 0) {
    return [""];
  }

  const lines = value.split("\n");
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines.length > 0 ? lines : [""];
}

function kindMark(kind: RowKind): string {
  if (kind === "added") {
    return "+";
  }
  if (kind === "removed") {
    return "-";
  }
  if (kind === "empty") {
    return "·";
  }
  return "=";
}

type LineOp = {
  type: "same" | "removed" | "added";
  value: string;
};

function alignReplacementLines(
  removedLines: string[],
  addedLines: string[],
  options: PrintOptions,
): LineOp[] {
  const m = removedLines.length;
  const n = addedLines.length;
  const dp = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (
        normalizeLine(removedLines[i] ?? "", options) ===
        normalizeLine(addedLines[j] ?? "", options)
      ) {
        dp[i][j] = (dp[i + 1]?.[j + 1] ?? 0) + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1]?.[j] ?? 0, dp[i]?.[j + 1] ?? 0);
      }
    }
  }

  const ops: LineOp[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (
      normalizeLine(removedLines[i] ?? "", options) === normalizeLine(addedLines[j] ?? "", options)
    ) {
      ops.push({ type: "same", value: removedLines[i] ?? "" });
      i += 1;
      j += 1;
      continue;
    }

    if ((dp[i + 1]?.[j] ?? 0) >= (dp[i]?.[j + 1] ?? 0)) {
      ops.push({ type: "removed", value: removedLines[i] ?? "" });
      i += 1;
      continue;
    }

    ops.push({ type: "added", value: addedLines[j] ?? "" });
    j += 1;
  }

  while (i < m) {
    ops.push({ type: "removed", value: removedLines[i] ?? "" });
    i += 1;
  }
  while (j < n) {
    ops.push({ type: "added", value: addedLines[j] ?? "" });
    j += 1;
  }

  return ops;
}

function normalizeLine(line: string, options: PrintOptions): string {
  let normalized = line;
  if (options.ignoreWhitespace) {
    normalized = normalized.replaceAll(/\s+/g, " ").trim();
  }
  if (options.ignoreCase) {
    normalized = normalized.toLowerCase();
  }
  return normalized;
}
