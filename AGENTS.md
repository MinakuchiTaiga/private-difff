# AGENTS.md

## Project Goal
`difff` ライクなテキスト差分比較ツールを、**完全クライアントサイド**で実装・公開する。  
最重要要件は「入力データをサーバーへ送らないこと」。公開先は GitHub Pages。

## Tech Stack
- Runtime: Browser only (no backend)
- App: TypeScript + Vite
- UI: Vanilla TS + semantic HTML + CSS Modules（または軽量CSS）
- Diff engine: `diff` (`jsdiff`)
- State: memory only (no persistent browser storage)
- Export: Markdown diff + print-friendly two-column page (browser print to PDF)
- Lint/Format: Biome
- Testing: Vitest（unit）+ Playwright（e2e, 任意）
- CI/CD: GitHub Actions + GitHub Pages
- Package manager: pnpm
- Versioning policy: exact versions only (`^` / `~` 禁止), `pnpm-lock.yaml` 必須

## Architecture Rules
- サーバーAPIを実装しない（Node/Express/Firebase等を使わない）。
- 入力テキストを外部送信しない。
- 解析タグや外部トラッカーを導入しない。
- 可能な限り外部CDNに依存せず、配布物へ同梱する。
- 通信関連API（`fetch`, `XMLHttpRequest`, `sendBeacon`, WebSocket）の導入は禁止。
- `localStorage` / `sessionStorage` / `IndexedDB` は使用禁止。
- タブクローズでデータが消えることを前提に設計する。

## Privacy/Security Checklist
- [ ] 差分計算が完全にブラウザ内で完結している
- [ ] 外部通信が静的アセット取得以外に発生しない
- [ ] `Content-Security-Policy` を設定（`connect-src 'self'` など）
- [ ] 永続ストレージ（`localStorage` / `sessionStorage` / `IndexedDB`）を使っていない
- [ ] タブを閉じると入力内容と差分が消える

## Recommended Structure
- `src/main.ts`: bootstrapping
- `src/diff/diffEngine.ts`: `jsdiff` ラッパー
- `src/state/store.ts`: メモリ状態
- `src/ui/*`: 入力/結果/オプションUI
- `src/export/markdown.ts`: Markdown(diff) 生成
- `src/export/printView.ts`: 印刷向け2カラムHTML生成
- `src/security/csp.ts`: CSP生成/管理（必要に応じて）

## Development Commands
- install: `pnpm install --frozen-lockfile`
- dev: `pnpm run dev`
- lint: `pnpm run lint` (Biome)
- format: `pnpm run format` (Biome)
- test: `pnpm run test`
- build: `pnpm run build`
- preview: `pnpm run preview`

## Development Rules
### セットアップ
- `pnpm install --frozen-lockfile`
- `pnpm run dev`

### 品質確認
- `pnpm run lint`
- `pnpm run test`
- `pnpm run build`

### テストカバレッジ基準
- 60%以上: 許容可能
- 75%以上: 推奨
- 90%以上: 例示的

### ローカル確認（重要）
- `dist/index.html` を `file://` で直接開くと、ブラウザのCORS制約でJS/CSSが読み込めない。
- 必ずHTTPサーバー経由で確認する（`pnpm run preview`）。
- 例: `http://localhost:4173/` を開く。

### デプロイ
- `main` ブランチへの push で `.github/workflows/pages.yml` が実行され、`dist` が GitHub Pages へデプロイされる。
- GitHubリポジトリ側で Pages のソースを `GitHub Actions` に設定する。

### バージョン固定ルール
- `package.json` では依存バージョンを完全固定（`^` / `~` 不使用）。
- `pnpm-lock.yaml` を必須管理。
- CI は `pnpm install --frozen-lockfile` で整合性を検証。

## Definition of Done
- 2テキスト入力 + ファイル読込 + 差分表示が動作
- 差分モード（文字/単語/行）を切替可能
- Markdown(diff) を出力できる
- 印刷向け2カラムページを生成し、ブラウザ印刷でPDF化できる
- GitHub Pages 上で正常に動作
- READMEにプライバシー前提と制約が明記されている

## Commit Rules
- コミットメッセージは日本語で記述すること
