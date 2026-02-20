import type { DiffMode } from "../diff/diffEngine";
import type { TextStats } from "../shared/textStats";
import type { IconName } from "./icons";

type DiffCounters = {
  addedUnits: number;
  removedUnits: number;
  unchangedUnits: number;
};

export function renderSummaryHtml(
  leftStats: TextStats,
  rightStats: TextStats,
  mode: DiffMode,
  counters: DiffCounters,
  renderIcon: (name: IconName) => string,
): string {
  const unitLabel = getUnitLabel(mode);
  return `
    <div class="summary-stats-grid">
      <article class="summary-stat">
        <h3>変更前</h3>
        <dl>
          <dt>行数</dt><dd>${leftStats.lines}</dd>
          <dt>単語数</dt><dd>${leftStats.words}</dd>
          <dt>文字数</dt><dd>${leftStats.chars}</dd>
          <dt>文字数（空白込み）</dt><dd>${leftStats.charsWithSpaces}</dd>
          <dt>文字数（空白・改行込み）</dt><dd>${leftStats.charsWithNewlines}</dd>
        </dl>
      </article>
      <article class="summary-stat">
        <h3>変更後</h3>
        <dl>
          <dt>行数</dt><dd>${rightStats.lines}</dd>
          <dt>単語数</dt><dd>${rightStats.words}</dd>
          <dt>文字数</dt><dd>${rightStats.chars}</dd>
          <dt>文字数（空白込み）</dt><dd>${rightStats.charsWithSpaces}</dd>
          <dt>文字数（空白・改行込み）</dt><dd>${rightStats.charsWithNewlines}</dd>
        </dl>
      </article>
    </div>
    <div class="summary-diff-grid">
      <p class="summary-added"><strong>${renderIcon("plus")}追加:</strong> ${counters.addedUnits} ${unitLabel}</p>
      <p class="summary-removed"><strong>${renderIcon("minus")}削除:</strong> ${counters.removedUnits} ${unitLabel}</p>
      <p class="summary-same"><strong>${renderIcon("equal")}維持:</strong> ${counters.unchangedUnits} ${unitLabel}</p>
    </div>
  `;
}

function getUnitLabel(mode: DiffMode): "文字" | "単語" | "行" {
  if (mode === "chars") {
    return "文字";
  }
  if (mode === "words") {
    return "単語";
  }
  return "行";
}
