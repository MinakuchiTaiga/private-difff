# private-difff

`difff` の体験から着想を得た、プライバシー重視のテキスト差分比較ツールです。  
完全クライアントサイドで動作し、入力テキストはタブ内メモリだけで扱います。

## 実装済み機能
- 左右のテキストを並べて、違いを色付きでわかりやすく比較できます。
- 文字単位・単語単位・行単位で、見たい粒度に切り替えて確認できます。
- 差分結果は Markdown で保存でき、印刷用の2カラム表示から PDF 化もしやすいです。
- 入力内容はブラウザ内だけで処理され、サーバーへ送信しません。

## プライバシー方針
- サーバーサイド処理なし
- アプリ側で通信API（`fetch` / `XMLHttpRequest` / `sendBeacon` / `WebSocket`）を使わない
- `localStorage` / `sessionStorage` / `IndexedDB` を使わない
- タブを閉じると入力データと差分結果は消える
- 本番配布時の `Content-Security-Policy` で `connect-src 'self'` を適用

## 技術スタック
- Package manager: `pnpm`
- App: TypeScript + Vite
- Diff engine: `diff` (`jsdiff`)
- Lint/Format: Biome
- Test: Vitest
- Deploy: GitHub Pages (GitHub Actions)

## ライセンス
MIT License（`LICENSE` を参照）
