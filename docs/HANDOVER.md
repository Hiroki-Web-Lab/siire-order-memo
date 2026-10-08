# 引き継ぎ書（HANDOVER）

> どの端末・どのセッションでも、作業前に必ずこのファイルを読む（`/devsession start`）。作業後は「現在地」を書き換え、「履歴」に1行追記して commit + push する（`/devsession finish`）。
> 詳細な経緯は Vault の `03_Projects/仕入発注メモ/2026-10-08_siire-order-memo_作業ログ.md` を参照。

## 現在地（最終更新: 2026-10-08 / ClaudeCode_Opus5.5 セッション1・main-win）

- **本番**: 未定（GitHub Pages 未有効化）
- **GitHub**: https://github.com/Hiroki-Web-Lab/siire-order-memo（public / main）
- **実装済み**: なし（壁打ちでプランを確定し、リポジトリと運用ファイルを作成しただけ。プランは `CLAUDE.md`）
- **復元ポイント `stable`**: なし

## 未完了・保留

- Phase 0: 現行 `siire_all_print.html` の DOM 構造（担当者ブロックの見出し・表の列・4行1品目）と CSP ヘッダーを確認する（読み取りのみ。ログインが必要なら本人のブラウザで確認）
- GitHub Pages の有効化（公開元フォルダは Phase 1 着手時に決める）
- 要確認: 数量の初期値にする「計」は 最低／中／最高 のどの行の計か（録画では判別できず。本人に確認）
- 要確認: 仕入先マスタの初期値（筑前・マルイ ほか）は本人に聞いて、各端末のパネルで登録する（リポジトリには入れない）

## 開発の約束事（要点）

- 運用は devsession スキルに従う（開始: 最新確認 → HANDOVER / 終了: HANDOVER 更新 → commit → push）
- 実装は orchestrate（Executor / Verifier）。ターゲット名 `siire-order-memo-<端末名>`
- 現行 hakataya.xsrv.jp には書き込まない（DOM を読むだけ）
- 公開リポジトリなので、業務データ（仕入先名・数量・価格）をコミットしない
- gitignore 対象で端末間に渡らないもの: 各端末の localStorage（仕入先マスタ・前回の仕入先）

## 履歴（新しい順・1行ずつ）

- 2026-10-08 S1: 画面録画から現状の発注作業を整理し、壁打ちでプラン確定（ブックマークレット + GitHub Pages・土物のみ・計を初期値・前回の仕入先を記憶・全体表示→仕入先別コピー）。リポジトリ作成と devsession 登録 — 実装なし
