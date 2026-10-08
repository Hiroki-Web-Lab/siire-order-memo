#!/usr/bin/env bash
# devsession Stop hook — Claude が応答を終えようとした時に走り、
# 「commit 済みなのに push していない」「commit に docs/HANDOVER.md が入っていない」を検出したら
# 終了を差し止めて（exit 2）Claude に続きをやらせる。複数端末運用での push 忘れを構造的に防ぐ。
#
# 設計（2026-09-06・P3）:
#   - 未コミットの変更（作業途中）は止めない。止めるのは commit と push の間の穴だけ。
#     セッション終了時の完全なチェック（未コミット・ログ・build）は SKILL.md の finish 手順で Claude 自身が行う
#   - 連続 3 回止めても解消しなければ諦めて通す（push 不能時の無限ループ防止）。カウンタは .git/ 内
#   - ユーザーが「push せずに終了」と言ったら Claude が .git/devsession-allow-unpushed を作る → 1 回だけ素通り
#   - fetch はしない（オフラインでも動くよう、最後に fetch した origin/main を基準にする）
#   - Vault に依存しない（このファイルだけで完結。リポジトリに同梱して全端末へ届ける）
#
# 配置: <repo>/.claude/hooks/devsession-stop.sh + <repo>/.claude/settings.json の hooks.Stop から呼ぶ
set -u
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
git rev-parse -q --verify origin/main >/dev/null 2>&1 || exit 0

gitdir="$(git rev-parse --git-dir)"
count_file="$gitdir/devsession-stop.count"
allow_file="$gitdir/devsession-allow-unpushed"
MAX_BLOCKS=3

# 免除フラグ（1回限り）
if [ -f "$allow_file" ]; then rm -f "$allow_file" "$count_file"; exit 0; fi

ahead="$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)"
reasons=()
if [ "$ahead" -gt 0 ]; then
  reasons+=("未 push のコミットが ${ahead} 件あります → git push を実行（non-fast-forward なら git pull --rebase 後に再 push）")
  if ! git diff --name-only origin/main..HEAD | grep -q '^docs/HANDOVER.md$'; then
    reasons+=("origin/main 以降のコミットに docs/HANDOVER.md が含まれていません → 現在地を書き換え・履歴に1行追記して同じ流れで commit")
  fi
fi

if [ "${#reasons[@]}" -eq 0 ]; then rm -f "$count_file"; exit 0; fi

n=0; [ -f "$count_file" ] && n="$(cat "$count_file" 2>/dev/null || echo 0)"
n=$((n + 1)); echo "$n" > "$count_file"
if [ "$n" -gt "$MAX_BLOCKS" ]; then
  # 諦めて通す（次回 session-start.sh の「ローカルが先」で拾われる）
  rm -f "$count_file"
  exit 0
fi

dirty=""; [ -n "$(git status --porcelain 2>/dev/null)" ] && dirty="（未コミットの変更もあります。終了するなら commit に含めるか、意図的に残す旨を報告）"
{
  echo "[devsession Stop ゲート ${n}/${MAX_BLOCKS}] このまま終了できません。次を行ってから再度終了してください:"
  for r in "${reasons[@]}"; do echo "  - $r"; done
  [ -n "$dirty" ] && echo "  $dirty"
  echo "  ユーザーが「push せずに終了」と明言した場合のみ: touch \"$allow_file\" で1回だけ免除できます。"
} >&2
exit 2
