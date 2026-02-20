import type { Change } from "diff";
import type { TwoColumnRow } from "../export/printView";
import { escapeHtml } from "../shared/html";
import type { IconName } from "./icons";

export function renderDiffHtml(parts: Change[]): string {
  return parts
    .map((part) => {
      const cls = part.added ? "added" : part.removed ? "removed" : "same";
      return `<span class="${cls}">${escapeHtml(part.value)}</span>`;
    })
    .join("");
}

export function renderTwoColumnDiffHtml(
  rows: TwoColumnRow[],
  renderIcon: (name: IconName) => string,
): string {
  const rowsHtml = rows
    .map(
      (row) => `
      <article class="diff-two-column-row">
        <section class="diff-two-column-pane ${row.left.kind}">
          <div class="diff-two-column-gutter">${escapeHtml(row.left.lineNumber || "·")}</div>
          <div class="diff-two-column-body">
            <span class="diff-two-column-kind">${kindMark(row.left.kind)}</span>
            <pre>${escapeHtml(row.left.text || " ")}</pre>
          </div>
        </section>
        <section class="diff-two-column-pane ${row.right.kind}">
          <div class="diff-two-column-gutter">${escapeHtml(row.right.lineNumber || "·")}</div>
          <div class="diff-two-column-body">
            <span class="diff-two-column-kind">${kindMark(row.right.kind)}</span>
            <pre>${escapeHtml(row.right.text || " ")}</pre>
          </div>
        </section>
      </article>
    `,
    )
    .join("");

  return `
    <div class="diff-two-column-head">
      <div>${renderIcon("file")}変更前</div>
      <div>${renderIcon("file")}変更後</div>
    </div>
    <div class="diff-two-column-rows">
      ${rowsHtml}
    </div>
  `;
}

function kindMark(kind: "same" | "added" | "removed" | "empty"): string {
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
