# パイロット対象タスク定義（NC-01）: 学習中メッセージを「自然に」調整

**作成日**: 2026年1月14日  
**ステータス**: ドラフト（Gate 0 成果物）  
**対象**: 母国語コーディング（日本語仕様→検証）パイロット  

参照:
- 課題集（原本）: [NATIVE_CODING_BENCHMARK_TASKS_2026-01.md](NATIVE_CODING_BENCHMARK_TASKS_2026-01.md)
- 推奨手順（Gate運用）: [NATIVE_CODING_REFINEMENT_WORKFLOW.md](NATIVE_CODING_REFINEMENT_WORKFLOW.md)
- UI不変条件: [docs/development/UI_IMMUTABLE_SPECIFICATIONS.md](../development/UI_IMMUTABLE_SPECIFICATIONS.md)

---

## 1. 目的（Goal）

学習中に表示されるメッセージ群を、押しつけがましくない自然な文面に調整する。

---

## 2. 入力（Raw request）

- 「学習中に出るメッセージ、もう少し自然にして。押しつけがましくない感じで」

---

## 3. スコープ（Scope）

- 対象: 「学習中に出るメッセージ」
  - 具体的には、学習セッション中に表示される文言（開始/正解/不正解/セッション終了などのうち、該当するもの）
- 変更種別: 文言の置換/文面調整（ロジック変更は原則なし）

---

## 4. 非目標（Non-goals）

- UIレイアウト/構造/色/順序などの変更（UI不変条件に抵触する変更）は行わない
- スコア計算、出題アルゴリズム、学習履歴の扱いなど機能ロジックの変更は行わない
- 新規画面の追加、設定項目追加などは行わない

---

## 5. 未確定点（Clarifications / Ask-to-commit）

変更着手前に、最低限次を確定する。

- 対象メッセージ範囲: どのタイミングのメッセージが対象か（開始/正解/不正解/終了/その他）
- 文体: 敬体（です/ます）/常体、句読点、絵文字の可否
- 長さ制約: 1メッセージ当たりの最大文字数（UI崩れ防止）
- トーン: 「押しつけがましくない」の具体（例: 命令形を避ける、断定を弱める、提案形に寄せる など）

---

## 6. 受け入れ条件（Acceptance Criteria）

### Intent Pass

- 対象メッセージが、押しつけがましくない自然な文面へ置換されている

### Safety Pass

- UI不変条件に抵触していない
- 既存のスモーク（または最低限の関連テスト）が通る

### Trace Pass

- 変更理由と対象範囲が、PR本文またはログで追跡できる

---

## 7. 変更箇所候補（Likely Touch Points）

- [src/ai/engagement/gamificationAI.ts](../../src/ai/engagement/gamificationAI.ts)
- [src/timeBasedGreeting.ts](../../src/timeBasedGreeting.ts)

※ 実際の対象箇所は「未確定点」で確定した範囲に合わせて最小化する。

---

## 8. 最小検証手順（Suggested Commands）

- `npm test`
- `npm run quality:check`
- `npm run test:smoke`

---

## 9. 記録（監査ログの最小項目）

- 意図（この文書）
- 仮定（未確定点をどう解釈したか）
- 差分（変更ファイルと要約）
- テスト（実行コマンドと結果）
- 結果（Intent/Safety/Trace の pass/fail と理由）
