# private-difff

`difff` の体験から着想を得た、プライバシー重視のテキスト差分比較ツールです。  
完全クライアントサイドで動作し、入力テキストはタブ内メモリだけで扱います。

## 実装済み機能
- 左右2カラムのテキスト入力（貼り付け + `.txt` 読み込み）
- 差分モード切替（文字 / 単語 / 行）
- オプション（大文字小文字無視、行モード時の空白無視）
- 追加/削除ハイライト付きの差分ビュー
- 差分サマリー（追加・削除・維持セグメント）
- Markdown(diff) ダウンロード
- 印刷向け2カラムページ生成（ブラウザ印刷でPDF化）
- `.txt` 読み込み上限（20MB/ファイル）

## プライバシー方針
- サーバーサイド処理なし
- アプリ側で通信API（`fetch` / `XMLHttpRequest` / `sendBeacon` / `WebSocket`）を使わない
- `localStorage` / `sessionStorage` / `IndexedDB` を使わない
- タブを閉じると入力データと差分結果は消える
- 本番配布時の `Content-Security-Policy` で `connect-src 'self'` を適用

## メタ情報（共有/検索向け）
- `index.html` に `title` / `description` を設定
- Open Graph（`og:title`, `og:description`, `og:type`, `og:site_name`）を設定
- X(Twitter)カード（`twitter:card`, `twitter:title`, `twitter:description`）を設定

## 技術スタック
- Package manager: `pnpm`
- App: TypeScript + Vite
- Diff engine: `diff` (`jsdiff`)
- Lint/Format: Biome
- Test: Vitest
- Deploy: GitHub Pages (GitHub Actions)

## セットアップ
```bash
pnpm install --frozen-lockfile
pnpm run dev
```

## 品質確認
```bash
pnpm run lint
pnpm run test
pnpm run build
```

## ローカル確認（重要）
- `dist/index.html` を `file://` で直接開くと、ブラウザのCORS制約でJS/CSSが読み込めません。
- 必ずHTTPサーバー経由で確認してください。

```bash
pnpm run preview
```

- 例: `http://localhost:4173/` を開く。

## デプロイ
- `main` ブランチへのpushで `.github/workflows/pages.yml` が実行され、`dist` がGitHub Pagesへデプロイされます。
- GitHubリポジトリ側で Pages のソースを `GitHub Actions` に設定してください。

## バージョン固定ルール
- `package.json` では依存バージョンを完全固定（`^` / `~` 不使用）
- `pnpm-lock.yaml` を必須管理
- CI は `pnpm install --frozen-lockfile` で整合性を検証
