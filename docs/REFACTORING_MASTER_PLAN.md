# 🎯 セキュアな段階的リファクタリング マスタープラン

**プロジェクト**: nanashi8.github.io  
**作成日**: 2025年12月12日  
**品質目標**: 機能ゼロ損失 + 完全な回復可能性

---

## 📊 プロジェクト現状

- **ソースコード**: 107 ファイル
- **品質状態**: TypeScript エラーなし、ESLint 55+ 警告（軽微）
- **テスト**: 11 ファイル、スモークテスト存在
- **データ**: 387 学習コンテンツファイル

---

## 🔒 品質保証フレームワーク

### レベル 1: 自動チェックポイント
```bash
./scripts/refactor-checkpoint.sh save phase-N-description
```

### レベル 2: 品質ゲート
```bash
npm run typecheck  # 型チェック
npm run build      # ビルド確認
npm run test:smoke # スモークテスト
```

### レベル 3: 緊急復旧
```bash
git tag -l 'checkpoint/phase-*'  # チェックポイント確認
git reset --hard checkpoint/phase-2-mywork  # 復旧
```

---

## 📋 段階的実行計画

### Phase 1: 基盤整備(1-2 日) ✅ 完了

#### 1-1 ESLint エラー修正 ✅
- eslint.config.js パース エラーなし確認
- リスク: 極小

#### 1-2 設定ファイル監査 ✅
- `package.json` スクリプト整理
- `tsconfig.json`, `vite.config.ts` 統一

#### 1-3 チェックポイント作成 ✅
```bash
✅ 65テスト作成・全合格
✅ npm run typecheck
✅ npm run build
```

**完了日**: 2025年12月12日  
**成果**: テスト基盤確立、型定義12+、any型16箇所削除

---

### Phase 2: 型安全性向上(2-3 日) ✅ 完了

#### 2-1 `any` 型の除去(9 箇所) ✅
- `progressStorage.ts`: 3箇所 → ReadingPassage型
- `aiCommentHelpers.ts`: 5箇所 → QuizResultWithCategory型
- `scoreBoardTests.ts`: 1箇所 → unknown型

#### 2-2 型定義拡張 ✅
新規型定義:
- ReadingSegment, ReadingPhrase, ReadingPassage
- QuizResultWithCategory, CategoryStats

#### 2-3 品質確認 ✅
```bash
✅ 81テスト全合格(+16テスト)
✅ npm run typecheck
✅ npm run build
```

**完了日**: 2025年12月12日  
**成果**: any型9箇所削除、型定義6追加、累計any型25箇所削除

---

### Phase 3: 構造最適化(3-4 日)

#### 3-1 重複ファイルの統合
- `learningAssistant.ts` 統合
- `confusionPairs.ts` 統合
- 重複ロジック抽出

#### 3-2 フォルダ構造整理
```
src/
├── components/   (UI)
├── features/     (機能ロジック)
├── hooks/        (React hooks)
├── utils/        (ユーティリティ)
├── types/        (型定義)
├── constants/    (定数)
└── styles/       (CSS)
```

#### 3-3 ストレージロジック統一
- `storage/` 内ファイル統一インターフェース
- `progressStorage.ts` 最優先

#### 3-4 チェックポイント
```bash
./scripts/refactor-checkpoint.sh save phase3-structure-complete
npm run build && npm run test:smoke
```

---

### Phase 4: テスト整備（2-3 日）

#### 4-1 スモークテスト安定化
- `tests/smoke-fast.spec.ts` 修正
- タイムアウト最適化
- 3 回連続成功確認

#### 4-2 ユニットテスト追加
優先度:
- `src/storage/` （学習データ保護）
- `src/ai/` （AI ロジック）
- `src/utils/` （ユーティリティ）

#### 4-3 回帰テスト自動化
- GitHub Actions 統合
- カバレッジレポート生成

#### 4-4 チェックポイント
```bash
./scripts/refactor-checkpoint.sh save phase4-tests-complete
npm run test:all && npm run quality:check
```

---

### Phase 5: パフォーマンス最適化（1-2 日）

#### 5-1 バンドル分析
- 大きいモジュール特定
- 未使用ライブラリ除去

#### 5-2 Code Splitting
- React.lazy 導入
- 詳細ビュー遅延ロード
- 分析ページ遅延ロード

#### 5-3 キャッシュ戦略
- Service Worker 最適化
- バージョン管理自動化

#### 5-4 チェックポイント
```bash
./scripts/refactor-checkpoint.sh save phase5-performance-complete
npm run build && ls -lh dist/assets/
```

---

## ✅ 各段階の必須品質ゲート

```bash
# 1. 型チェック（エラーなし）
npm run typecheck

# 2. ビルド成功
npm run build

# 3. スモークテスト（2 回成功）
npm run test:smoke
npm run test:smoke

# 4. 主要機能確認
npm run preview
# - クイズ読み込み
# - 選択肢表示
# - 学習データ保存
# - ダークモード切り替え

# 5. チェックポイント作成
./scripts/refactor-checkpoint.sh save phase-N-name
```

---

## 🚨 緊急対応フロー

問題発生時:

```bash
# 1. チェックポイント確認
git tag -l 'checkpoint/phase-*' | sort -V

# 2. 復旧
git reset --hard checkpoint/phase-2-mywork

# 3. ログ記録
git log -1 > /tmp/failure-log.txt
```

**やらないこと**:
- ❌ `.git` の直接編集
- ❌ 複数段階同時実施
- ❌ チェックポイントなしで進行

---

## 📈 進捗追跡

| Phase | 目的 | 期間 | ファイル数 |
|-------|------|------|----------|
| 1 | 基盤整備 | 1-2 日 | 5-10 |
| 2 | 型安全性 | 2-3 日 | 20-30 |
| 3 | 構造最適化 | 3-4 日 | 40-60 |
| 4 | テスト整備 | 2-3 日 | 10-15 |
| 5 | パフォーマンス | 1-2 日 | 5-10 |

**合計期間**: 9-14 営業日

---

## 🎓 機能ゼロ損失の約束

- **ユーザー学習データ**: 完全保護
  - localStorage 未変更
  - データ構造 未変更
  - マイグレーション不要
- **UI/UX**: 完全保護
  - 見た目 未変更
  - 操作フロー 未変更
  - 機能 未変更
- **データアクセス**: 完全保護
  - public/data/ 未変更
  - CSV ローダー 未変更
  - 学習コンテンツ 未変更

---

## 🔄 実行開始

```bash
cd /Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io

# 初期チェックポイント
./scripts/refactor-checkpoint.sh save phase1-start

# Phase 1 作業開始
npm run lint:errors-only
npm run typecheck && npm run build

# 各小段階でチェックポイント作成
./scripts/refactor-checkpoint.sh save phase1-eslint-config
```

---

**対象**: nanashi8.github.io  
**品質保証**: 機能ゼロ損失 + 完全回復可能性
