import type { Change } from "diff";
import { type DiffMode, createDiff } from "../diff/diffEngine";
import { calculateTextStats, countLines } from "../shared/textStats";
import { renderDiffHtml, renderTwoColumnDiffHtml } from "./diffMarkup";
import { query } from "./dom";
import { hydrateStaticIcons, icon } from "./icons";
import { ACCEPT_TEXT_FILE_TYPES, readTextFile } from "./readTextFile";
import { renderSummaryHtml } from "./summaryMarkup";

const INITIAL_LEFT = "before line 1\nbefore line 2\nbefore line 3";
const INITIAL_RIGHT = "before line 1\nafter line 2\nbefore line 3\nnew line 4";

let markdownModulePromise: Promise<typeof import("../export/markdown")> | undefined;
let textModulePromise: Promise<typeof import("../export/text")> | undefined;
let jsonModulePromise: Promise<typeof import("../export/json")> | undefined;
let htmlModulePromise: Promise<typeof import("../export/html")> | undefined;
let printViewModulePromise: Promise<typeof import("../export/printView")> | undefined;

export function renderApp(root: HTMLElement): void {
  hydrateStaticIcons(root);

  const leftText = query<HTMLTextAreaElement>("#left-text", root);
  const rightText = query<HTMLTextAreaElement>("#right-text", root);
  const leftFile = query<HTMLInputElement>("#left-file", root);
  const rightFile = query<HTMLInputElement>("#right-file", root);
  const ignoreCase = query<HTMLInputElement>("#ignore-case", root);
  const ignoreWhitespace = query<HTMLInputElement>("#ignore-whitespace", root);
  const modeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-mode]"));
  const layoutButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-layout]"));
  const exportTrigger = query<HTMLButtonElement>("#export-trigger", root);
  const exportMenu = query<HTMLElement>("#export-menu", root);
  const optionsTrigger = query<HTMLButtonElement>("#options-trigger", root);
  const optionsModal = query<HTMLDialogElement>("#options-modal", root);
  const diffView = query<HTMLElement>("#diff-view", root);
  const diffViewTwoColumn = query<HTMLElement>("#diff-view-two-column", root);
  const summary = query<HTMLElement>("#summary", root);

  leftText.value = leftText.value || INITIAL_LEFT;
  rightText.value = rightText.value || INITIAL_RIGHT;
  leftFile.accept = ACCEPT_TEXT_FILE_TYPES;
  rightFile.accept = ACCEPT_TEXT_FILE_TYPES;

  const initialSnapshot = {
    left: leftText.value,
    right: rightText.value,
  };
  let currentMode: DiffMode = "lines";
  let currentLayout: "single" | "double" = "single";
  let renderVersion = 0;

  exportTrigger.addEventListener("click", () => {
    const willOpen = exportMenu.hidden;
    exportMenu.hidden = !willOpen;
    exportTrigger.setAttribute("aria-expanded", String(willOpen));
  });

  exportMenu.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }
    const format = target.dataset.export;
    if (!format) {
      return;
    }
    void exportByFormat(format);
    closeExportMenu();
  });

  document.addEventListener("click", (event) => {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }
    if (!exportMenu.hidden && !exportMenu.contains(target) && !exportTrigger.contains(target)) {
      closeExportMenu();
    }
  });

  optionsTrigger.addEventListener("click", () => {
    optionsModal.showModal();
  });

  optionsModal.addEventListener("click", (event) => {
    const target = event.target as Node;
    if (target === optionsModal) {
      optionsModal.close();
    }
  });

  for (const button of modeButtons) {
    button.addEventListener("click", () => {
      const value = button.dataset.mode as DiffMode | undefined;
      if (!value || value === currentMode) {
        return;
      }
      currentMode = value;
      computeAndRender();
    });
  }

  for (const button of layoutButtons) {
    button.addEventListener("click", () => {
      if (button.dataset.disabled === "true") {
        return;
      }
      const value = button.dataset.layout as "single" | "double" | undefined;
      if (!value || value === currentLayout) {
        return;
      }
      currentLayout = value;
      computeAndRender();
    });
  }

  leftFile.addEventListener("change", async (event) => {
    const input = event.currentTarget as HTMLInputElement;
    try {
      leftText.value = await readTextFile(input.files?.[0]);
      computeAndRender();
    } catch (error) {
      const message = error instanceof Error ? error.message : "ファイル読み込みに失敗しました。";
      window.alert(message);
      input.value = "";
    }
  });

  rightFile.addEventListener("change", async (event) => {
    const input = event.currentTarget as HTMLInputElement;
    try {
      rightText.value = await readTextFile(input.files?.[0]);
      computeAndRender();
    } catch (error) {
      const message = error instanceof Error ? error.message : "ファイル読み込みに失敗しました。";
      window.alert(message);
      input.value = "";
    }
  });

  leftText.addEventListener("input", computeAndRender);
  rightText.addEventListener("input", computeAndRender);
  ignoreCase.addEventListener("change", computeAndRender);
  ignoreWhitespace.addEventListener("change", computeAndRender);
  window.addEventListener("beforeunload", handleBeforeUnload);

  computeAndRender();

  function computeAndRender(): void {
    const activeRenderVersion = ++renderVersion;
    updateModeDependentControls();
    syncToggleButtons();

    const result = createDiff(leftText.value, rightText.value, {
      mode: currentMode,
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });
    const leftStats = calculateTextStats(leftText.value);
    const rightStats = calculateTextStats(rightText.value);
    const addedUnits = countUnits(result.parts, currentMode, "added");
    const removedUnits = countUnits(result.parts, currentMode, "removed");
    const unchangedUnits = countUnits(result.parts, currentMode, "same");

    diffView.innerHTML = renderDiffHtml(result.parts);
    const isSingleLayout = currentLayout === "single";
    diffView.hidden = !isSingleLayout;
    diffViewTwoColumn.hidden = isSingleLayout;
    if (isSingleLayout) {
      diffViewTwoColumn.innerHTML = "";
    } else {
      diffViewTwoColumn.innerHTML = '<p class="diff-loading">2カラム表示を準備中...</p>';
      void renderTwoColumnView(
        activeRenderVersion,
        leftText.value,
        rightText.value,
        ignoreCase.checked,
        ignoreWhitespace.checked,
      );
    }
    summary.innerHTML = renderSummaryHtml(
      leftStats,
      rightStats,
      currentMode,
      {
        addedUnits,
        removedUnits,
        unchangedUnits,
      },
      icon,
    );
  }

  async function exportByFormat(format: string): Promise<void> {
    try {
      if (format === "markdown") {
        await exportMarkdown();
        return;
      }
      if (format === "text") {
        await exportText();
        return;
      }
      if (format === "json") {
        await exportJson();
        return;
      }
      if (format === "html") {
        await exportHtml();
        return;
      }
      if (format === "pdf") {
        await openPrintableLayout();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "エクスポート中に問題が発生しました。";
      window.alert(message);
    }
  }

  async function renderTwoColumnView(
    activeRenderVersion: number,
    leftValue: string,
    rightValue: string,
    ignoreCaseChecked: boolean,
    ignoreWhitespaceChecked: boolean,
  ): Promise<void> {
    const { buildTwoColumnRows } = await loadPrintViewModule();
    if (activeRenderVersion !== renderVersion || currentLayout !== "double") {
      return;
    }
    const rows = buildTwoColumnRows(leftValue, rightValue, {
      ignoreCase: ignoreCaseChecked,
      ignoreWhitespace: ignoreWhitespaceChecked,
    });
    diffViewTwoColumn.innerHTML = renderTwoColumnDiffHtml(rows, icon);
  }

  function closeExportMenu(): void {
    exportMenu.hidden = true;
    exportTrigger.setAttribute("aria-expanded", "false");
  }

  async function exportMarkdown(): Promise<void> {
    const { buildDiffMarkdown } = await loadMarkdownModule();
    const markdown = buildDiffMarkdown(leftText.value, rightText.value, {
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });
    downloadFile(markdown, "diff-result.diff.md", "text/markdown;charset=utf-8");
  }

  async function exportText(): Promise<void> {
    const { buildDiffText } = await loadTextModule();
    const plainText = buildDiffText(leftText.value, rightText.value, {
      mode: currentMode,
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });
    downloadFile(plainText, "diff-result.diff.txt", "text/plain;charset=utf-8");
  }

  async function exportJson(): Promise<void> {
    const { buildDiffJson } = await loadJsonModule();
    const json = buildDiffJson(leftText.value, rightText.value, {
      mode: currentMode,
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });
    downloadFile(json, "diff-result.diff.json", "application/json;charset=utf-8");
  }

  async function exportHtml(): Promise<void> {
    const { buildDiffHtml } = await loadHtmlModule();
    const html = buildDiffHtml(leftText.value, rightText.value, {
      mode: currentMode,
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });
    downloadFile(html, "diff-result.diff.html", "text/html;charset=utf-8");
  }

  async function openPrintableLayout(): Promise<void> {
    const { buildPrintableTwoColumnHtml } = await loadPrintViewModule();
    const html = buildPrintableTwoColumnHtml(leftText.value, rightText.value, {
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const printUrl = URL.createObjectURL(blob);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      URL.revokeObjectURL(printUrl);
      window.alert("ポップアップを許可してから再試行してください。");
      return;
    }

    printWindow.opener = null;
    printWindow.location.replace(printUrl);
    window.setTimeout(() => URL.revokeObjectURL(printUrl), 60_000);
  }

  function handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (!hasUnsavedTextChanges()) {
      return;
    }
    event.preventDefault();
    event.returnValue = "";
  }

  function hasUnsavedTextChanges(): boolean {
    return leftText.value !== initialSnapshot.left || rightText.value !== initialSnapshot.right;
  }

  function updateModeDependentControls(): void {
    const isLineMode = currentMode === "lines";
    ignoreWhitespace.disabled = !isLineMode;
    for (const button of layoutButtons) {
      const isDouble = button.dataset.layout === "double";
      const disabled = isDouble && !isLineMode;
      button.dataset.disabled = disabled ? "true" : "false";
      button.setAttribute("aria-disabled", String(disabled));
      if (disabled) {
        button.title = "この表示は行モード時のみです";
      } else {
        button.removeAttribute("title");
      }
    }
    if (!isLineMode && currentLayout !== "single") {
      currentLayout = "single";
    }
  }

  function syncToggleButtons(): void {
    for (const button of modeButtons) {
      const isActive = button.dataset.mode === currentMode;
      button.setAttribute("aria-pressed", String(isActive));
      button.dataset.active = isActive ? "true" : "false";
    }
    for (const button of layoutButtons) {
      const isActive = button.dataset.layout === currentLayout;
      button.setAttribute("aria-pressed", String(isActive));
      button.dataset.active = isActive ? "true" : "false";
    }
  }
}

function loadMarkdownModule(): Promise<typeof import("../export/markdown")> {
  markdownModulePromise ??= import("../export/markdown");
  return markdownModulePromise;
}

function loadTextModule(): Promise<typeof import("../export/text")> {
  textModulePromise ??= import("../export/text");
  return textModulePromise;
}

function loadJsonModule(): Promise<typeof import("../export/json")> {
  jsonModulePromise ??= import("../export/json");
  return jsonModulePromise;
}

function loadHtmlModule(): Promise<typeof import("../export/html")> {
  htmlModulePromise ??= import("../export/html");
  return htmlModulePromise;
}

function loadPrintViewModule(): Promise<typeof import("../export/printView")> {
  printViewModulePromise ??= import("../export/printView");
  return printViewModulePromise;
}

function countUnits(parts: Change[], mode: DiffMode, kind: "added" | "removed" | "same"): number {
  return parts.reduce((count, part) => {
    if (kind === "added" && !part.added) {
      return count;
    }
    if (kind === "removed" && !part.removed) {
      return count;
    }
    if (kind === "same" && (part.added || part.removed)) {
      return count;
    }
    return count + countTextUnits(part.value, mode);
  }, 0);
}

function countTextUnits(text: string, mode: DiffMode): number {
  if (text.length === 0) {
    return 0;
  }

  if (mode === "chars") {
    return text.length;
  }

  if (mode === "words") {
    return text
      .trim()
      .split(/\s+/u)
      .filter((value) => value.length > 0).length;
  }

  return countLines(text);
}

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}
