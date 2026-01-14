# research/（研究・構想）

このディレクトリは、プロダクト/開発手法に関する研究・構想・評価設計を集約します。
「実装に落とすための検証可能な形（手順・評価・監査）」まで含めることを目的とします。

---

## 入口（まず読む）

- 日本語×国産AI×母国語コーディング（統合構想）
  - [JAPANESE_CENTRIC_DOMESTIC_AI_NATIVE_CODING_VISION.md](JAPANESE_CENTRIC_DOMESTIC_AI_NATIVE_CODING_VISION.md)
- 母国語コーディングと日本語の可能性（短い概念整理）
  - [NATIVE_LANGUAGE_CODING_AND_JAPANESE_POTENTIAL_CONCEPT.md](NATIVE_LANGUAGE_CODING_AND_JAPANESE_POTENTIAL_CONCEPT.md)

---

## 検証に落とす（運用ドキュメント）

- 推奨手順（Gate付き・検証駆動）
  - [NATIVE_CODING_REFINEMENT_WORKFLOW.md](NATIVE_CODING_REFINEMENT_WORKFLOW.md)
- 評価ベンチ（比較条件・指標・採点の最小設計）
  - [NATIVE_CODING_EVALUATION_BENCHMARK.md](NATIVE_CODING_EVALUATION_BENCHMARK.md)
- 課題集（このリポジトリ向け・日本語特性を含む）
  - [NATIVE_CODING_BENCHMARK_TASKS_2026-01.md](NATIVE_CODING_BENCHMARK_TASKS_2026-01.md)
- 監査ログ/責任分界（運用の安全弁）
  - [NATIVE_CODING_AUDIT_GOVERNANCE_SPEC.md](NATIVE_CODING_AUDIT_GOVERNANCE_SPEC.md)
- Gate 0 成果物（パイロット対象タスク定義・例）
  - [NATIVE_CODING_PILOT_TASK_DEFINITION_NC_01.md](NATIVE_CODING_PILOT_TASK_DEFINITION_NC_01.md)

---

## UDD（未知駆動開発）

- UDDの有意性（性能論ではなく品質システムとして整理）
  - [UDD_SIGNIFICANCE_CONCEPT.md](UDD_SIGNIFICANCE_CONCEPT.md)
- 参考（既存のUDD関連まとめ）
  - [UDD_METABOLIC_MONITORING_VALIDATION_SUMMARY_JP.md](UDD_METABOLIC_MONITORING_VALIDATION_SUMMARY_JP.md)
  - [CLINICAL_TRIAL_OS_CONCEPT.md](CLINICAL_TRIAL_OS_CONCEPT.md)

---

## 参考（過去の研究）

- [ADAPTIVE_LEARNING_RESEARCH_2024.md](ADAPTIVE_LEARNING_RESEARCH_2024.md)

---

## 次にやること（最短）

1. 課題集から1件（例: NC-01）を選び、要求（raw）→確認質問→確定仕様→差分→テスト→観測の順に実施
2. 監査ログの最小項目（意図/仮定/差分/テスト/結果）を残す
3. 失敗した場合は、UDDの未知分類（要求/仕様/実装/評価/運用）で原因分解して次の改善対象を決める
