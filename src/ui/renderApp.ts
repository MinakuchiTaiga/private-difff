import type { Change } from "diff";
import { type DiffMode, createDiff } from "../diff/diffEngine";
import { buildDiffHtml } from "../export/html";
import { buildDiffJson } from "../export/json";
import { buildDiffMarkdown } from "../export/markdown";
import { buildPrintableTwoColumnHtml, buildTwoColumnRows } from "../export/printView";
import { buildDiffText } from "../export/text";

const INITIAL_LEFT = "before line 1\nbefore line 2\nbefore line 3";
const INITIAL_RIGHT = "before line 1\nafter line 2\nbefore line 3\nnew line 4";
const MAX_TEXT_FILE_BYTES = 20 * 1024 * 1024;
const ACCEPT_TEXT_FILE_TYPES = [
  ".txt",
  ".md",
  ".markdown",
  ".html",
  ".htm",
  ".css",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".jsonc",
  ".yaml",
  ".yml",
  ".xml",
  ".svg",
  ".csv",
  ".tsv",
  ".ini",
  ".conf",
  ".config",
  ".toml",
  ".env",
  ".log",
  ".sql",
  ".sh",
  ".bash",
  ".zsh",
  ".py",
  ".rb",
  ".go",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".rs",
  ".php",
  ".vue",
  ".svelte",
  ".astro",
  ".wsl",
].join(",");

const ALLOWED_TEXT_EXTENSIONS = new Set(
  ACCEPT_TEXT_FILE_TYPES.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0),
);

const ALLOWED_TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/xml",
  "application/javascript",
  "application/x-javascript",
  "application/ecmascript",
  "application/sql",
  "application/yaml",
  "application/x-yaml",
  "application/toml",
  "application/x-sh",
]);

type IconName =
  | "lock"
  | "chip"
  | "github"
  | "help"
  | "compass"
  | "type"
  | "align"
  | "bolt"
  | "fileCode"
  | "printer"
  | "file"
  | "folder"
  | "split"
  | "layout"
  | "settings"
  | "plus"
  | "minus"
  | "equal"
  | "trash";

export function renderApp(root: HTMLElement): void {
  root.innerHTML = `
    <main class="page">
      <header class="topbar fade-in delay-0">
        <div class="brand-wrap">
          <p class="eyebrow">
            ${icon("lock")}プライバシー重視のテキスト差分ツール
            <span class="tooltip-wrap">
              <button
                type="button"
                class="tooltip-trigger"
                aria-label="プライバシー方針を表示"
                aria-describedby="privacy-tooltip"
              >
                ${icon("help")}
              </button>
              <span id="privacy-tooltip" role="tooltip" class="tooltip">
                入力テキストはブラウザ内でのみ処理されます。外部送信せず、永続ストレージにも保存しません。
              </span>
            </span>
          </p>
          <h1>private-difff</h1>
        </div>
        <div class="topbar-links">
          <p class="memory-chip">${icon("chip")}メモリのみ保持 • タブを閉じると消去</p>
          <a
            class="repo-link"
            href="https://github.com/MinakuchiTaiga/private-difff"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHubリポジトリを開く"
            title="GitHubリポジトリ"
          >
            ${icon("github")}
          </a>
        </div>
      </header>

      <section class="editor-grid fade-in delay-2">
        <article class="card editor">
          <div class="editor-head">
            <h2>${icon("file")}変更前テキスト</h2>
            <label class="ghost-file" aria-label="変更前テキストのファイルを読み込む" title="ファイルを読み込む">
              ${icon("folder")}
              <input id="left-file" type="file" accept="${ACCEPT_TEXT_FILE_TYPES}" />
            </label>
          </div>
          <textarea id="left-text" spellcheck="false">${INITIAL_LEFT}</textarea>
        </article>

        <article class="card editor">
          <div class="editor-head">
            <h2>${icon("file")}変更後テキスト</h2>
            <label class="ghost-file" aria-label="変更後テキストのファイルを読み込む" title="ファイルを読み込む">
              ${icon("folder")}
              <input id="right-file" type="file" accept="${ACCEPT_TEXT_FILE_TYPES}" />
            </label>
          </div>
          <textarea id="right-text" spellcheck="false">${INITIAL_RIGHT}</textarea>
        </article>
      </section>

      <section id="summary" class="summary card fade-in delay-3"></section>

      <section class="result card fade-in delay-4">
        <div class="result-head">
          <div class="result-title">
            <h2>${icon("split")}差分結果</h2>
            <p>追加/削除をインラインでハイライト表示（入力のたびに更新）</p>
          </div>
          <div class="result-toolbar">
            <div class="result-settings">
              <div class="toggle-group" role="group" aria-label="比較モード">
                <button type="button" class="toggle-btn" data-mode="lines">行</button>
                <button type="button" class="toggle-btn" data-mode="words">単語</button>
                <button type="button" class="toggle-btn" data-mode="chars">文字</button>
              </div>
              <div class="toggle-group" role="group" aria-label="表示">
                <button type="button" class="toggle-btn" data-layout="single">1列</button>
                <button type="button" class="toggle-btn" data-layout="double">2列</button>
              </div>
            </div>
            <div class="result-quick-actions">
              <div class="icon-menu">
                <button
                  id="export-trigger"
                  type="button"
                  class="icon-btn"
                  aria-label="エクスポート"
                  title="エクスポート"
                  aria-haspopup="menu"
                  aria-expanded="false"
                  aria-controls="export-menu"
                >
                  ${icon("fileCode")}
                </button>
                <div id="export-menu" class="mini-menu" role="menu" hidden>
                  <button type="button" data-export="markdown" role="menuitem">Markdown (.diff.md)</button>
                  <button type="button" data-export="text" role="menuitem">Text (.diff.txt)</button>
                  <button type="button" data-export="json" role="menuitem">JSON (.diff.json)</button>
                  <button type="button" data-export="html" role="menuitem">HTML (.diff.html)</button>
                  <button type="button" data-export="pdf" role="menuitem">PDF（印刷レイアウト）</button>
                </div>
              </div>
              <button
                id="options-trigger"
                type="button"
                class="icon-btn"
                aria-label="オプション"
                title="オプション"
              >
                ${icon("settings")}
              </button>
            </div>
          </div>
        </div>
        <dialog id="options-modal" class="mini-modal">
          <form method="dialog" class="mini-modal-card">
            <header class="mini-modal-head">
              <h3>オプション</h3>
              <button type="submit" class="mini-close">閉じる</button>
            </header>
            <div class="mini-modal-body">
              <label class="switch"
                ><input id="ignore-case" type="checkbox" /> 大文字・小文字の違いを無視する</label
              >
              <label class="switch"
                ><input id="ignore-whitespace" type="checkbox" /> 行頭/行末の空白を無視する（行モードのみ）</label
              >
            </div>
          </form>
        </dialog>
        <pre id="diff-view" aria-live="polite"></pre>
        <section id="diff-view-two-column" class="diff-two-column" hidden aria-live="polite"></section>
      </section>

      <footer class="copyright fade-in delay-4">© 2026 private-difff</footer>
    </main>
  `;

  const leftText = query<HTMLTextAreaElement>("#left-text");
  const rightText = query<HTMLTextAreaElement>("#right-text");
  const ignoreCase = query<HTMLInputElement>("#ignore-case");
  const ignoreWhitespace = query<HTMLInputElement>("#ignore-whitespace");
  const modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-mode]"));
  const layoutButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-layout]"));
  const exportTrigger = query<HTMLButtonElement>("#export-trigger");
  const exportMenu = query<HTMLElement>("#export-menu");
  const optionsTrigger = query<HTMLButtonElement>("#options-trigger");
  const optionsModal = query<HTMLDialogElement>("#options-modal");
  const diffView = query<HTMLElement>("#diff-view");
  const diffViewTwoColumn = query<HTMLElement>("#diff-view-two-column");
  const summary = query<HTMLElement>("#summary");
  const initialSnapshot = {
    left: leftText.value,
    right: rightText.value,
  };
  let currentMode: DiffMode = "lines";
  let currentLayout: "single" | "double" = "single";

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
    exportByFormat(format);
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
      if (button.disabled) {
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

  query<HTMLInputElement>("#left-file").addEventListener("change", async (event) => {
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

  query<HTMLInputElement>("#right-file").addEventListener("change", async (event) => {
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
    updateModeDependentControls(currentMode);
    syncToggleButtons();
    const result = createDiff(leftText.value, rightText.value, {
      mode: currentMode,
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });
    const leftStats = calculateTextStats(leftText.value);
    const rightStats = calculateTextStats(rightText.value);
    const unitLabel = getUnitLabel(currentMode);
    const addedUnits = countUnits(result.parts, currentMode, "added");
    const removedUnits = countUnits(result.parts, currentMode, "removed");
    const unchangedUnits = countUnits(result.parts, currentMode, "same");

    diffView.innerHTML = renderDiffHtml(result.parts);
    diffViewTwoColumn.innerHTML = renderTwoColumnDiffHtml(leftText.value, rightText.value, {
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });

    const isSingleLayout = currentLayout === "single";
    diffView.hidden = !isSingleLayout;
    diffViewTwoColumn.hidden = isSingleLayout;
    summary.innerHTML = `
      <div class="summary-stats-grid">
        <article class="summary-stat">
          <h3>変更前統計</h3>
          <dl>
            <dt>文字数</dt><dd>${leftStats.chars}</dd>
            <dt>空白数</dt><dd>${leftStats.spaces}</dd>
            <dt>空白込み文字数</dt><dd>${leftStats.charsWithSpaces}</dd>
            <dt>改行数</dt><dd>${leftStats.newlines}</dd>
            <dt>改行込み文字数</dt><dd>${leftStats.charsWithNewlines}</dd>
            <dt>単語数</dt><dd>${leftStats.words}</dd>
          </dl>
        </article>
        <article class="summary-stat">
          <h3>変更後統計</h3>
          <dl>
            <dt>文字数</dt><dd>${rightStats.chars}</dd>
            <dt>空白数</dt><dd>${rightStats.spaces}</dd>
            <dt>空白込み文字数</dt><dd>${rightStats.charsWithSpaces}</dd>
            <dt>改行数</dt><dd>${rightStats.newlines}</dd>
            <dt>改行込み文字数</dt><dd>${rightStats.charsWithNewlines}</dd>
            <dt>単語数</dt><dd>${rightStats.words}</dd>
          </dl>
        </article>
      </div>
      <div class="summary-diff-grid">
        <p class="summary-added"><strong>${icon("plus")}追加:</strong> ${addedUnits} ${unitLabel}</p>
        <p class="summary-removed"><strong>${icon("minus")}削除:</strong> ${removedUnits} ${unitLabel}</p>
        <p class="summary-same"><strong>${icon("equal")}維持:</strong> ${unchangedUnits} ${unitLabel}</p>
      </div>
    `;
  }

  function exportByFormat(format: string): void {
    if (format === "markdown") {
      exportMarkdown();
      return;
    }
    if (format === "text") {
      exportText();
      return;
    }
    if (format === "json") {
      exportJson();
      return;
    }
    if (format === "html") {
      exportHtml();
      return;
    }
    if (format === "pdf") {
      openPrintableLayout();
    }
  }

  function closeExportMenu(): void {
    exportMenu.hidden = true;
    exportTrigger.setAttribute("aria-expanded", "false");
  }

  function exportMarkdown(): void {
    const markdown = buildDiffMarkdown(leftText.value, rightText.value, {
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });
    downloadFile(markdown, "diff-result.diff.md", "text/markdown;charset=utf-8");
  }

  function exportText(): void {
    const plainText = buildDiffText(leftText.value, rightText.value, {
      mode: currentMode,
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });
    downloadFile(plainText, "diff-result.diff.txt", "text/plain;charset=utf-8");
  }

  function exportJson(): void {
    const json = buildDiffJson(leftText.value, rightText.value, {
      mode: currentMode,
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });
    downloadFile(json, "diff-result.diff.json", "application/json;charset=utf-8");
  }

  function exportHtml(): void {
    const html = buildDiffHtml(leftText.value, rightText.value, {
      mode: currentMode,
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });
    downloadFile(html, "diff-result.diff.html", "text/html;charset=utf-8");
  }

  function openPrintableLayout(): void {
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

  function updateModeDependentControls(currentMode: DiffMode): void {
    const isLineMode = currentMode === "lines";
    ignoreWhitespace.disabled = !isLineMode;
    for (const button of layoutButtons) {
      button.disabled = !isLineMode;
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

function icon(name: IconName): string {
  const common =
    'class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

  if (name === "lock") {
    return `<svg ${common}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;
  }
  if (name === "chip") {
    return `<svg ${common}><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/></svg>`;
  }
  if (name === "github") {
    return `<svg ${common} viewBox="0 0 24 24" stroke-width="1.5"><path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48 0-.24-.01-1.03-.01-1.87-2.5.46-3.15-.61-3.35-1.17-.11-.28-.58-1.17-.99-1.41-.34-.18-.82-.62-.01-.63.76-.01 1.3.7 1.48.99.87 1.46 2.26 1.05 2.82.8.09-.63.34-1.05.61-1.29-2.22-.25-4.54-1.11-4.54-4.92 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.26.1-2.62 0 0 .84-.27 2.75 1.03a9.5 9.5 0 0 1 5 0c1.91-1.31 2.75-1.03 2.75-1.03.55 1.36.2 2.37.1 2.62.64.7 1.03 1.59 1.03 2.69 0 3.82-2.33 4.67-4.55 4.92.35.3.67.88.67 1.79 0 1.29-.01 2.33-.01 2.65 0 .26.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>`;
  }
  if (name === "help") {
    return `<svg ${common}><path d="M9.4 9a2.6 2.6 0 1 1 4.6 1.7c-.6.7-1.6 1.1-1.6 2.3"/><path d="M12 17.2h.01"/></svg>`;
  }
  if (name === "compass") {
    return `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="m10 14 2-4 2 4-4 0z"/></svg>`;
  }
  if (name === "type") {
    return `<svg ${common}><path d="M4 7h16M8 7v10M16 7v10M6 17h12"/></svg>`;
  }
  if (name === "align") {
    return `<svg ${common}><path d="M4 7h16M7 12h10M4 17h16"/></svg>`;
  }
  if (name === "bolt") {
    return `<svg ${common}><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>`;
  }
  if (name === "fileCode") {
    return `<svg ${common}><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/></svg>`;
  }
  if (name === "printer") {
    return `<svg ${common}><path d="M6 9V4h12v5"/><rect x="6" y="14" width="12" height="7" rx="1"/><path d="M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/></svg>`;
  }
  if (name === "file") {
    return `<svg ${common}><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h6"/></svg>`;
  }
  if (name === "folder") {
    return `<svg ${common}><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;
  }
  if (name === "split") {
    return `<svg ${common}><path d="M6 3v18M18 3v18M10 7h8M10 17h8"/></svg>`;
  }
  if (name === "layout") {
    return `<svg ${common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14"/></svg>`;
  }
  if (name === "settings") {
    return `<svg ${common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.8 1.8 0 1 1-3.6 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1.8 1.8 0 1 1 0-3.6h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1.8 1.8 0 1 1 3.6 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a1.8 1.8 0 1 1 0 3.6h-.2a1 1 0 0 0-.9.6Z"/></svg>`;
  }
  if (name === "plus") {
    return `<svg ${common}><path d="M12 5v14M5 12h14"/></svg>`;
  }
  if (name === "minus") {
    return `<svg ${common}><path d="M5 12h14"/></svg>`;
  }
  if (name === "equal") {
    return `<svg ${common}><path d="M5 9h14M5 15h14"/></svg>`;
  }

  return `<svg ${common}><path d="M4 7h16M7 7v13h10V7"/><path d="M10 11v6M14 11v6"/></svg>`;
}

function renderDiffHtml(parts: Change[]): string {
  return parts
    .map((part) => {
      const cls = part.added ? "added" : part.removed ? "removed" : "same";
      return `<span class="${cls}">${escapeHtml(part.value)}</span>`;
    })
    .join("");
}

function renderTwoColumnDiffHtml(
  leftText: string,
  rightText: string,
  options: { ignoreCase: boolean; ignoreWhitespace: boolean },
): string {
  const rows = buildTwoColumnRows(leftText, rightText, options);
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
      <div>${icon("file")}変更前</div>
      <div>${icon("file")}変更後</div>
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

function getUnitLabel(mode: DiffMode): "文字" | "単語" | "行" {
  if (mode === "chars") {
    return "文字";
  }
  if (mode === "words") {
    return "単語";
  }
  return "行";
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
    const words = text
      .trim()
      .split(/\s+/u)
      .filter((value) => value.length > 0);
    return words.length;
  }

  const lines = text.split("\n");
  if (lines[lines.length - 1] === "") {
    return Math.max(lines.length - 1, 0);
  }
  return lines.length;
}

function calculateTextStats(text: string): {
  chars: number;
  spaces: number;
  charsWithSpaces: number;
  newlines: number;
  charsWithNewlines: number;
  words: number;
} {
  const charsWithNewlines = text.length;
  const spaces = (text.match(/ /g) || []).length;
  const newlines = (text.match(/\n/g) || []).length;
  const charsWithSpaces = charsWithNewlines - newlines;
  const chars = charsWithSpaces - spaces;
  const words =
    text.trim().length === 0
      ? 0
      : text
          .trim()
          .split(/\s+/u)
          .filter((value) => value.length > 0).length;

  return {
    chars,
    spaces,
    charsWithSpaces,
    newlines,
    charsWithNewlines,
    words,
  };
}

async function readTextFile(file: File | undefined): Promise<string> {
  if (!file) {
    return "";
  }
  if (file.size > MAX_TEXT_FILE_BYTES) {
    throw new Error(
      `ファイルサイズが上限を超えています。${Math.floor(MAX_TEXT_FILE_BYTES / (1024 * 1024))}MB以下にしてください。`,
    );
  }
  if (!isAllowedTextFile(file)) {
    throw new Error("対応しているテキストファイルを選択してください。");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (isLikelyBinaryData(bytes)) {
    throw new Error(
      "テキストファイルとして読み込めませんでした。バイナリファイルの可能性があります。",
    );
  }

  return decodeTextBytes(bytes);
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

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function query<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
}

function isAllowedTextFile(file: File): boolean {
  const extension = getLowerCaseExtension(file.name);
  if (extension && ALLOWED_TEXT_EXTENSIONS.has(extension)) {
    return true;
  }

  if (file.type.startsWith("text/")) {
    return true;
  }

  return ALLOWED_TEXT_MIME_TYPES.has(file.type.toLowerCase());
}

function getLowerCaseExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === filename.length - 1) {
    return "";
  }
  return filename.slice(dotIndex).toLowerCase();
}

function isLikelyBinaryData(bytes: Uint8Array): boolean {
  if (bytes.length === 0) {
    return false;
  }

  if (hasUtf16Bom(bytes) || looksLikeUtf16WithoutBom(bytes)) {
    return false;
  }

  const sampleLength = Math.min(bytes.length, 4096);
  let suspiciousControls = 0;
  for (let index = 0; index < sampleLength; index += 1) {
    const value = bytes[index];
    if (value === 0) {
      return true;
    }
    const isControl = value < 32 && value !== 9 && value !== 10 && value !== 13;
    if (isControl) {
      suspiciousControls += 1;
    }
  }

  return suspiciousControls / sampleLength > 0.3;
}

function decodeTextBytes(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    return "";
  }

  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return decodeWithEncoding(bytes, "utf-8");
  }

  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return decodeWithEncoding(bytes, "utf-16le");
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return decodeWithEncoding(bytes, "utf-16be");
  }

  if (looksLikeUtf16WithoutBom(bytes)) {
    if (hasEvenZeroBias(bytes)) {
      return decodeWithEncoding(bytes, "utf-16be");
    }
    return decodeWithEncoding(bytes, "utf-16le");
  }

  const candidates = ["utf-8", "shift_jis", "euc-jp", "iso-2022-jp"];
  for (const encoding of candidates) {
    try {
      return decodeWithEncoding(bytes, encoding, true);
    } catch {
      // Try the next candidate encoding.
    }
  }

  return decodeWithEncoding(bytes, "utf-8");
}

function decodeWithEncoding(bytes: Uint8Array, encoding: string, fatal = false): string {
  const decoder = new TextDecoder(encoding, { fatal });
  return decoder.decode(bytes);
}

function hasUtf16Bom(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 2 &&
    ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff))
  );
}

function looksLikeUtf16WithoutBom(bytes: Uint8Array): boolean {
  if (bytes.length < 4) {
    return false;
  }
  const sampleLength = Math.min(bytes.length, 4096);
  const evenZeroRatio = countZerosAtStride(bytes, 0, sampleLength);
  const oddZeroRatio = countZerosAtStride(bytes, 1, sampleLength);
  const hasLePattern = oddZeroRatio > 0.3 && evenZeroRatio < 0.05;
  const hasBePattern = evenZeroRatio > 0.3 && oddZeroRatio < 0.05;
  return hasLePattern || hasBePattern;
}

function hasEvenZeroBias(bytes: Uint8Array): boolean {
  const sampleLength = Math.min(bytes.length, 4096);
  return countZerosAtStride(bytes, 0, sampleLength) > countZerosAtStride(bytes, 1, sampleLength);
}

function countZerosAtStride(bytes: Uint8Array, start: number, end: number): number {
  let zeroCount = 0;
  let total = 0;
  for (let index = start; index < end; index += 2) {
    total += 1;
    if (bytes[index] === 0) {
      zeroCount += 1;
    }
  }
  if (total === 0) {
    return 0;
  }
  return zeroCount / total;
}
