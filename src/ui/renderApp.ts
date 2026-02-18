import type { Change } from "diff";
import { type DiffMode, createDiff } from "../diff/diffEngine";
import { buildDiffMarkdown } from "../export/markdown";
import { buildPrintableTwoColumnHtml } from "../export/printView";

const INITIAL_LEFT = "before line 1\nbefore line 2\nbefore line 3";
const INITIAL_RIGHT = "before line 1\nafter line 2\nbefore line 3\nnew line 4";
const MAX_TEXT_FILE_BYTES = 20 * 1024 * 1024;

type IconName =
  | "lock"
  | "chip"
  | "compass"
  | "type"
  | "align"
  | "bolt"
  | "fileCode"
  | "printer"
  | "file"
  | "folder"
  | "split"
  | "plus"
  | "minus"
  | "equal"
  | "trash";

export function renderApp(root: HTMLElement): void {
  root.innerHTML = `
    <main class="page">
      <header class="topbar fade-in delay-0">
        <div class="brand-wrap">
          <p class="eyebrow">${icon("lock")}プライバシー重視の差分ツール</p>
          <h1>private-difff</h1>
        </div>
        <p class="memory-chip">${icon("chip")}メモリのみ保持 • タブを閉じると消去</p>
      </header>

      <section class="actions card fade-in delay-1">
        <div class="control-row">
          <label class="field">
            <span class="icon-text">${icon("compass")}モード</span>
            <select id="mode">
              <option value="lines">行</option>
              <option value="words">単語</option>
              <option value="chars">文字</option>
            </select>
          </label>

          <label class="switch"><input id="ignore-case" type="checkbox" /> ${icon("type")}大文字・小文字を無視</label>
          <label class="switch"
            ><input id="ignore-whitespace" type="checkbox" /> ${icon("align")}行頭/行末の空白を無視（行モード）</label
          >
        </div>

        <div class="control-row">
          <button id="run-diff" class="btn primary">${icon("bolt")}差分を更新</button>
          <button id="download-markdown" class="btn">${icon("fileCode")}Markdown(diff)を保存</button>
          <button id="open-print" class="btn">${icon("printer")}印刷レイアウトを開く（PDF化）</button>
        </div>
      </section>

      <section class="editor-grid fade-in delay-2">
        <article class="card editor">
          <div class="editor-head">
            <h2>${icon("file")}左テキスト</h2>
            <label class="ghost-file">
              ${icon("folder")}.txt読込
              <input id="left-file" type="file" accept=".txt,text/plain" />
            </label>
          </div>
          <textarea id="left-text" spellcheck="false">${INITIAL_LEFT}</textarea>
        </article>

        <article class="card editor">
          <div class="editor-head">
            <h2>${icon("file")}右テキスト</h2>
            <label class="ghost-file">
              ${icon("folder")}.txt読込
              <input id="right-file" type="file" accept=".txt,text/plain" />
            </label>
          </div>
          <textarea id="right-text" spellcheck="false">${INITIAL_RIGHT}</textarea>
        </article>
      </section>

      <section id="summary" class="summary card fade-in delay-3"></section>

      <section class="result card fade-in delay-4">
        <div class="result-head">
          <h2>${icon("split")}差分結果</h2>
          <p>追加/削除セグメントをインラインでハイライト表示</p>
        </div>
        <pre id="diff-view" aria-live="polite"></pre>
      </section>
    </main>
  `;

  const leftText = query<HTMLTextAreaElement>("#left-text");
  const rightText = query<HTMLTextAreaElement>("#right-text");
  const mode = query<HTMLSelectElement>("#mode");
  const ignoreCase = query<HTMLInputElement>("#ignore-case");
  const ignoreWhitespace = query<HTMLInputElement>("#ignore-whitespace");
  const diffView = query<HTMLElement>("#diff-view");
  const summary = query<HTMLElement>("#summary");

  query("#run-diff").addEventListener("click", computeAndRender);

  query("#download-markdown").addEventListener("click", () => {
    const markdown = buildDiffMarkdown(leftText.value, rightText.value, {
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });
    downloadFile(markdown, "diff-result.diff.md", "text/markdown;charset=utf-8");
  });

  query("#open-print").addEventListener("click", () => {
    const html = buildPrintableTwoColumnHtml(leftText.value, rightText.value, {
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const printUrl = URL.createObjectURL(blob);
    const printWindow = window.open(printUrl, "_blank", "noopener,noreferrer");
    if (!printWindow) {
      URL.revokeObjectURL(printUrl);
      window.alert("ポップアップを許可してから再試行してください。");
      return;
    }

    window.setTimeout(() => URL.revokeObjectURL(printUrl), 60_000);
  });

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
  mode.addEventListener("change", computeAndRender);
  ignoreCase.addEventListener("change", computeAndRender);
  ignoreWhitespace.addEventListener("change", computeAndRender);

  computeAndRender();

  function computeAndRender(): void {
    const result = createDiff(leftText.value, rightText.value, {
      mode: mode.value as DiffMode,
      ignoreCase: ignoreCase.checked,
      ignoreWhitespace: ignoreWhitespace.checked,
    });

    diffView.innerHTML = renderDiffHtml(result.parts);
    summary.innerHTML = `
      <p><strong>${icon("plus")}追加:</strong> ${result.summary.addedSegments} セグメント / ${result.summary.addedChars} 文字</p>
      <p><strong>${icon("minus")}削除:</strong> ${result.summary.removedSegments} セグメント / ${result.summary.removedChars} 文字</p>
      <p><strong>${icon("equal")}維持:</strong> ${result.summary.unchangedSegments} セグメント</p>
      <p><strong>${icon("trash")}保存:</strong> メモリのみ（タブを閉じると消去）</p>
    `;
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
    return `<svg ${common}><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="m10 13-2 2 2 2M14 13l2 2-2 2"/></svg>`;
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

async function readTextFile(file: File | undefined): Promise<string> {
  if (!file) {
    return "";
  }
  if (file.size > MAX_TEXT_FILE_BYTES) {
    throw new Error(
      `ファイルサイズが上限を超えています。${Math.floor(MAX_TEXT_FILE_BYTES / (1024 * 1024))}MB以下にしてください。`,
    );
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("ファイル読み込みに失敗しました。"));
    reader.readAsText(file, "utf-8");
  });
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
