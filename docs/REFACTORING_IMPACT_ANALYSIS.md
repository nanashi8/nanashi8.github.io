---
title: docs/ リファクタリング影響調査結果
created: 2026-01-09
updated: 2026-01-09
status: implemented
tags: [documentation, refactoring, analysis]
---

# docs/ リファクタリング影響調査結果

作成日: 2026-01-09

## 結論

**配線は切れます（影響範囲: 中程度）**

docs 直下の 23 ファイルを移動すると、**約 100 箇所のリンク修正**が必要です。

---

## 参照数の多いファイル（移動時に影響大）

| ファイル名 | 参照数 | 推奨配置先 | 修正難易度 |
|-----------|--------|-----------|-----------|
| `AI_INTEGRATION_GUIDE.md` | 22 | `guides/` | 高 |
| `PHASE1_2_COMPLETION_REPORT.md` | 8 | `reports/archive/phases/` | 中 |
| `HOW_TO_ENABLE_AI.md` | 7 | `how-to/` | 中 |
| `ML_OPERATION_GUIDE.md` | 4 | `guides/` | 低 |
| `AI_REALTIME_GUARD_SYSTEM.md` | 4 | `specifications/` | 低 |
| `AI_PROJECT_COMPLETE.md` | 4 | `reports/` | 低 |
| `MAINTENANCE_AI_GUIDE.md` | 3 | `maintenance/` | 低 |
| `GIT_HISTORY_LEARNING_REPORT.md` | 3 | `reports/` | 低 |

---

## 具体的な影響箇所

### 1. AI_INTEGRATION_GUIDE.md（22 参照）

**影響するファイル例**
- `development/UNIFIED_SCHEDULER_IMPLEMENTATION_COMPLETE.md`
- `development/INTEGRATION_TEST_REPORT.md`
- `development/AI_INTEGRATION_GUIDE.md`（自己参照）
- `development/BATCH_SYSTEM_TDD_PLAN.md`
- `extensions/servant/docs/AUTOPILOT_DELIBERATION_GUIDE.md`

**リンクパターン**
```markdown
[14AI統合ガイド](./ai-systems/integration-guide.md)
[14AI統合ガイド](../ai-systems/integration-guide.md)
[AI評価システム](../../docs/ai-systems/integration-guide.md)
```

### 2. PHASE1_2_COMPLETION_REPORT.md（8 参照）

**影響するファイル例**
- `reports/CONSTELLATION_PHASE6_COMPLETION.md`
- `plans/` 配下の複数ファイル

### 3. HOW_TO_ENABLE_AI.md（7 参照）

**影響するファイル例**
- `how-to/TESTING_GUIDE.md`
- `guidelines/` 配下の複数ファイル

---

## INDEX.md の状態

- **現状**: 2025-12-21 作成、総ファイル数 301 と記載（実際は 459 ファイル）
- **構造**: カテゴリ別分類はあるが、docs 直下の 23 ファイルへの直接リンクは含まれていない
- **影響**: INDEX.md 自体は docs 直下ファイルを直接参照していないため、移動による直接影響は小さい

---

## リファクタリング実施の選択肢

### 選択肢 A: 段階的リファクタリング（推奨）

**フェーズ 1a: 参照の少ないファイルのみ移動**
- 参照数 0〜3 のファイル（約 15 ファイル）を先に移動
- リンク修正箇所: 約 20 箇所
- 所要時間: 30 分程度

**フェーズ 1b: 参照の多いファイルを移動**
- `AI_INTEGRATION_GUIDE.md` など 4 件以上のファイル（8 ファイル）
- リンク修正箇所: 約 80 箇所
- 所要時間: 1〜2 時間

**メリット**
- 影響範囲を段階的に確認できる
- 問題が起きても巻き戻しが容易

**デメリット**
- 完了まで時間がかかる
- 2 回に分けてコミットが必要

---

### 選択肢 B: 一括リファクタリング

**実施内容**
- docs 直下の 23 ファイルを一括移動
- 約 100 箇所のリンクを一括修正
- INDEX.md の情報を更新

**メリット**
- 一度で完了する
- 中途半端な状態が残らない

**デメリット**
- 影響範囲が大きく、見落としリスクが高い
- 問題発生時の原因特定が難しい

---

### 選択肢 C: 自動化スクリプトで対応

**実施内容**
1. 移動計画ファイル（JSON/YAML）を作成
2. スクリプトで以下を自動実行:
   - ファイル移動
   - リンクパスの一括置換（正規表現）
   - INDEX.md の更新
3. git diff で差分確認

**メリット**
- 手作業ミスがない
- 将来の再リファクタリングに再利用可能

**デメリット**
- スクリプト作成に時間がかかる（初回のみ）
- 複雑なリンクパターンの対応が必要

---

### 選択肢 D: 見送り（現状維持）

**実施内容**
- リファクタリングせず、今後は docs 直下に新規ファイルを置かないルールだけ設ける

**メリット**
- リンク切れリスクゼロ
- 作業時間ゼロ

**デメリット**
- 既存の構造問題が残る
- 新旧の配置ルールが混在して混乱

---

## 推奨アクション

**即実施（低リスク）**: 選択肢 A のフェーズ 1a のみ
- 参照数 0〜3 の 15 ファイルを移動
- 約 20 箇所のリンク修正（手作業で対応可能）

**中期検討**: 選択肢 C（自動化スクリプト作成）
- フェーズ 1b 以降を自動化で実施
- 再現性・安全性が高い

---

## 次のアクション

1. **フェーズ 1a を実施する**（参照少ないファイルのみ移動）
2. **自動化スクリプトを作成してから全体実施**
3. **見送り**（現状維持 + 新規ファイルのルール明確化のみ）

どれにしますか？
