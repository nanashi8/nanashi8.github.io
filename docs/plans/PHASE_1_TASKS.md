# Phase 1: 基盤構築 タスクリスト

**期間**: 2025年12月 - 2026年2月  
**ステータス**: 進行中  
**完了率**: 40%

---

## 📋 優先タスク（今すぐ実施）

### 🏗️ 1. ディレクトリ構造の整備

#### タスク
- [ ] `/tools/` ディレクトリ作成
- [x] `geometry-demo.html` を `/tools/demos/geometry-demo.html` に移動 ✅
- [ ] `/tools/README.md` 作成
- [ ] `/public/data/geometry/` ディレクトリ作成
- [ ] `/public/data/english/` ディレクトリ作成

#### 成果物
```
/tools/
├── README.md
├── geometry-editor/
│   └── index.html
└── english-editor/
    └── (未実装)

/public/data/
├── geometry/
│   ├── problems/
│   └── assets/
└── english/
    ├── vocabulary/
    ├── listening/
    └── grammar/
```

#### 期限
2025年12月15日

---

### 💾 2. エクスポート機能の実装

#### タスク
- [ ] JSON エクスポート機能
- [ ] SVG エクスポート機能
- [ ] 統一データフォーマット定義
- [ ] エクスポートボタンUI追加
- [ ] ファイル名自動生成

#### 実装例
```typescript
function exportProblemData() {
  const data = {
    id: generateId(),
    type: "geometry",
    title: prompt("問題のタイトル:"),
    difficulty: selectDifficulty(),
    shapes: {
      semicircle: semicircle,
      points: points,
      lines: customLines,
      texts: customTexts
    },
    question: prompt("問題文:"),
    answer: prompt("解答:"),
    metadata: {
      createdAt: new Date().toISOString(),
      author: "admin"
    }
  };
  
  downloadJSON(data, `${data.id}.json`);
  downloadSVG(`${data.id}.svg`);
}
```

#### 期限
2025年12月20日

---

### 📄 3. データフォーマット標準化

#### タスク
- [ ] TypeScript型定義ファイル作成
- [ ] JSON Schema 作成
- [ ] バリデーションスクリプト作成
- [ ] サンプルデータ作成

#### 成果物
```
/docs/specifications/
├── problem-schema.json
├── geometry-problem.d.ts
├── english-problem.d.ts
└── validator.js

/public/data/examples/
├── geometry-sample-001.json
└── english-sample-001.json
```

#### 期限
2025年12月25日

---

### 🎨 4. 最初の問題セット作成

#### タスク
- [ ] 幾何問題 10問作成
  - [ ] 三角形 3問
  - [ ] 円 3問
  - [ ] 四角形 2問
  - [ ] 複合図形 2問
- [ ] 各問題にメタデータ追加
- [ ] SVG画像生成
- [ ] 解答・解説作成

#### 品質基準
- データフォーマット準拠率: 100%
- 解答の正確性: 100%
- 解説の充実度: 各問題3行以上

#### 期限
2026年1月10日

---

## 📚 中期タスク（1-2ヶ月以内）

### 🔍 5. プレビュー・検証機能

#### タスク
- [ ] プレビューモーダル実装
- [ ] リアルタイムプレビュー
- [ ] データ検証機能
- [ ] エラー表示UI
- [ ] 警告・推奨事項表示

#### 期限
2026年1月20日

---

### 📖 6. ドキュメント整備

#### タスク
- [ ] オーサリングツール使用マニュアル
- [ ] データフォーマット仕様書
- [ ] 問題作成ガイドライン
- [ ] トラブルシューティングガイド
- [ ] FAQ作成

#### 成果物
```
/docs/tools/
├── GEOMETRY_EDITOR_MANUAL.md
├── DATA_FORMAT_SPECIFICATION.md
├── PROBLEM_CREATION_GUIDE.md
└── FAQ.md
```

#### 期限
2026年1月31日

---

### 🎯 7. テンプレートシステム

#### タスク
- [ ] 問題テンプレート5種類作成
  - [ ] 三角形の合同
  - [ ] 円周角の定理
  - [ ] 平行四辺形の性質
  - [ ] 三平方の定理
  - [ ] カスタム
- [ ] テンプレート読み込み機能
- [ ] テンプレート保存機能
- [ ] テンプレートギャラリーUI

#### 期限
2026年2月10日

---

## 🔄 継続的タスク

### 📊 データ品質管理

#### 週次タスク
- [ ] 新規問題のレビュー
- [ ] データ整合性チェック
- [ ] エラー修正
- [ ] メタデータ更新

#### 月次タスク
- [ ] 品質レポート作成
- [ ] 改善計画策定
- [ ] スクリプト最適化

---

### 🐛 バグ修正・改善

#### 報告されている問題
- [ ] 半円スナップの精度向上
- [ ] ドラッグ時のパフォーマンス改善
- [ ] モバイル対応検討
- [ ] ブラウザ互換性テスト

---

## 🎯 Phase 1 完了基準

### 必須条件（Must Have）
- [x] 幾何CADツール基本機能完成
- [ ] エクスポート機能実装
- [ ] データフォーマット標準化
- [ ] サンプル問題 10問作成
- [ ] 基本ドキュメント整備

### 推奨条件（Should Have）
- [ ] プレビュー機能
- [ ] テンプレートシステム
- [ ] データ検証機能
- [ ] 詳細マニュアル

### 任意条件（Nice to Have）
- [ ] AI画像生成統合
- [ ] 自動問題生成
- [ ] 共同編集機能

---

## 📈 進捗トラッキング

### 週次チェックポイント

**Week 1 (12/8-12/14)**
- [x] ロードマップ作成
- [ ] ディレクトリ構造整備
- [ ] エクスポート機能設計

**Week 2 (12/15-12/21)**
- [ ] エクスポート機能実装
- [ ] データフォーマット定義
- [ ] 最初の問題作成開始

**Week 3 (12/22-12/28)**
- [ ] バリデーション機能
- [ ] 問題作成継続（5問）
- [ ] ドキュメント開始

**Week 4 (12/29-1/4)**
- [ ] 問題作成完了（10問）
- [ ] プレビュー機能開始
- [ ] 年末レビュー

---

## 🔗 関連リソース

- [PLATFORM_ROADMAP.md](./PLATFORM_ROADMAP.md) - 全体ロードマップ
- [DATA_QUALITY_REPORT.md](./guidelines/DATA_QUALITY_REPORT.md) - データ品質計画
- [CROSS_FILE_CONSISTENCY.md](./guidelines/CROSS_FILE_CONSISTENCY.md) - 整合性ガイドライン

---

## 📝 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-08 | Phase 1 タスクリスト初版作成 |

---

**次のアクション**: タスク #1「ディレクトリ構造の整備」から開始
