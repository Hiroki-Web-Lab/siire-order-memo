# 引き継ぎ書（HANDOVER）

> どの端末・どのセッションでも、作業前に必ずこのファイルを読む（`/devsession start`）。作業後は「現在地」を書き換え、「履歴」に1行追記して commit + push する（`/devsession finish`）。
> 詳細な経緯は Vault の `03_Projects/仕入発注メモ/2026-10-08_siire-order-memo_作業ログ.md` を参照。

## 現在地（最終更新: 2026-10-08 / ClaudeCode_Opus5.5 セッション2・macmini）

- **本番**: https://hiroki-web-lab.github.io/siire-order-memo/ （GitHub Pages・main / root。導入ページ `index.html`、本体 `siire-order-memo.js`）
- **GitHub**: https://github.com/Hiroki-Web-Lab/siire-order-memo（public / main）
- **実装済み（Phase 1）**: 土物ブロックの読み取り → 全体表示（チェック・段階 最低/中/最高/直接・数量・仕入先、一括段階切替、初期「中」）→ 仕入先別の文面と [コピー]。仕入先マスタ（既定5社 筑前・丸邦・西部青果・アグリ・大同青果・設定画面で編集）と品目ごとの前回仕入先を localStorage（接頭辞 `siireOrderMemo.`）に保存。数量0・未チェック・仕入先未選択は出力しない（未選択は件数警告）
- **テスト**: `node test/logic.test.js`（依存なし）。画面確認は `python3 -m http.server` で `test/fixture.html`（合成データ）
- **復元ポイント `stable`**: なし

## Phase 0 の確認結果（2026-10-08 S2・実ページ 2026/10/09 を読み取りのみで確認）

- CSP: 応答ヘッダー・meta とも無し → Pages 配信方式のまま
- 見出し `form > div.clearfix > p`「仕入担当者名：<b>土物</b>　YYYY/MM/DD 仕入一覧表」。1ブロックは 8品目ごとの複数 `table.table-bordered-print-mini` に分割
- 見出し行 th = [colspan2 仕入対象アイテム, 店舗×16, 計, 備考]。1品目 = 4行（1行目に rowspan4 の品目名・備考、最低／中／最高／希望単価）
- ページ全体が `<form method="post" action="siire_list.html">` の中。パネルは body 直下に置き、ボタンはすべて type="button"

## 未完了・保留

- Phase 2: Windows / Mac / iPhone でブックマーク登録し実運用で確認（iOS で入力欄フォーカス時のズームが気になれば font-size 16px へ）
- Phase 3（必要なら）: 設定の書き出し／読み込み

## 開発の約束事（要点）

- 運用は devsession スキルに従う（開始: 最新確認 → HANDOVER / 終了: HANDOVER 更新 → commit → push）
- 実装は orchestrate（Executor / Verifier）。ターゲット名 `siire-order-memo-<端末名>`
- 現行 hakataya.xsrv.jp には書き込まない（DOM を読むだけ）
- 公開リポジトリなので、日々の業務データ（数量・価格）をコミットしない。仕入先名は公開してよい（本人確認済み）
- gitignore 対象で端末間に渡らないもの: 各端末の localStorage（仕入先マスタ・前回の仕入先）

## 履歴（新しい順・1行ずつ）

- 2026-10-08 S2 追記: 既定の仕入先に西部青果を追加（アグリの前）。既に仕入先を保存した端末には反映されない（設定画面で追加する）
- 2026-10-08 S2: Phase 0（DOM・CSP 確認、CSP なし）と Phase 1 実装（orchestrate: codex 実装・Sonnet 検証 PASS）。GitHub Pages を main / root で有効化
- 2026-10-08 S1 追記2: 仕入先名は公開リポジトリに含めてよいと本人が確認。4社をコードの既定値にする方針へ変更
- 2026-10-08 S1 追記: 数量の選び方（最低／中／最高・直接入力・0 は出力しない）と仕入先4社を確定
- 2026-10-08 S1: 画面録画から現状の発注作業を整理し、壁打ちでプラン確定（ブックマークレット + GitHub Pages・土物のみ・計を初期値・前回の仕入先を記憶・全体表示→仕入先別コピー）。リポジトリ作成と devsession 登録 — 実装なし
