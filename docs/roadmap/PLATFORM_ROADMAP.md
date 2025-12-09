# 教育プラットフォーム開発ロードマップ

**最終更新**: 2025年12月8日  
**ステータス**: 計画中

---

## 🎯 ビジョン

個別最適化された学習体験を提供する、包括的な教育プラットフォームの構築

### コアコンセプト
- **学習者中心**: ユーザーの進捗に応じた適応的な学習体験
- **コンテンツファースト**: 高品質な問題・教材の継続的な提供
- **オープン＆拡張可能**: モジュール化されたアーキテクチャ

---

## 🏗️ 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    教育プラットフォーム                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
   【管理者側】                              【学習者側】
   オーサリングツール群                      学習アプリ
        │                                       │
        ├─ 幾何問題作成ツール                  ├─ 英語学習
        ├─ 英語問題作成ツール                  ├─ 数学学習
        ├─ AI画像生成ツール                    ├─ 進捗管理
        └─ 音声生成ツール                      └─ 分析ダッシュボード
        │                                       │
        ▼                                       ▼
   データ生成・検証                         コンテンツ消費
        │                                       │
        └───────────────┬───────────────────────┘
                        │
                  データ管理層
              （GitHub / Firebase）
```

---

## 📅 開発フェーズ

### **Phase 1: 基盤構築** ✅ 進行中

**期間**: 2025年12月 - 2026年2月  
**目標**: コアプラットフォームとプロトタイプツールの完成

#### 完了済み
- ✅ 英単語学習アプリの基本機能
- ✅ データ品質管理フレームワーク
- ✅ パッセージベース学習システム
- ✅ 文法問題生成パイプライン
- ✅ 幾何CADツール（プロトタイプ）

#### 進行中
- ⏳ データ品質の継続的改善
- ⏳ オーサリングツールの整備
- ⏳ エクスポート機能の実装

#### 次のマイルストーン
- [ ] `/tools/` ディレクトリ構造の確立
- [ ] 統一データフォーマットの定義
- [ ] 最初のサンプル問題セット作成
- [ ] プレビュー・検証機能

---

### **Phase 2: オーサリングツール完成** 📋 計画中

**期間**: 2026年3月 - 2026年5月  
**目標**: プロフェッショナルな問題作成環境の提供

#### オーサリングツール群の開発

##### 1. 幾何問題作成ツール
```
/tools/geometry-editor/
├── index.html                 # メインエディタ
├── templates/                 # 問題テンプレート
│   ├── triangle.json
│   ├── circle.json
│   ├── quadrilateral.json
│   └── custom.json
├── examples/                  # サンプル問題
└── README.md
```

**機能要件**:
- [x] 基本図形の描画（点、線、円）
- [x] ドラッグ&ドロップ編集
- [x] スナップ機能（半円への吸着）
- [ ] グリッド・ルーラー
- [ ] 寸法表示機能
- [ ] 角度測定機能
- [ ] JSON/SVGエクスポート
- [ ] テンプレートからの読み込み
- [ ] プレビュー機能
- [ ] データ検証

##### 2. 英語問題作成ツール
```
/tools/english-editor/
├── vocabulary-creator.html    # 単語問題
├── listening-creator.html     # リスニング問題
├── conversation-creator.html  # 会話問題
├── grammar-creator.html       # 文法問題
└── audio-generator/
    ├── tts-generator.html     # 音声合成
    └── audio-editor.html      # 音声編集
```

**機能要件**:
- [ ] 問題タイプ別のフォーム
- [ ] 音声ファイルのアップロード/生成
- [ ] TTS統合（Text-to-Speech）
- [ ] 画像・イラスト追加
- [ ] タグ・カテゴリ管理
- [ ] 難易度設定
- [ ] カリキュラム紐付け

##### 3. AI支援ツール
```
/tools/ai-tools/
├── image-generator.html       # AI画像生成
├── problem-generator.html     # 問題自動生成
└── variation-generator.html   # 類題生成
```

**機能要件**:
- [ ] OpenAI DALL-E統合
- [ ] Stable Diffusion統合
- [ ] GPT-4による問題文生成
- [ ] 類似問題の自動生成

#### 共通機能
- [ ] 統一エクスポート形式
- [ ] データ検証ツール
- [ ] プレビュー機能
- [ ] バッチ処理
- [ ] 使用ドキュメント

---

### **Phase 3: データ基盤強化** 📋 計画中

**期間**: 2026年6月 - 2026年8月  
**目標**: スケーラブルなデータ管理システム

#### データ構造の標準化

```typescript
// 共通問題スキーマ
interface BaseProblem {
  id: string;
  type: 'geometry' | 'vocabulary' | 'listening' | 'grammar' | 'reading';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  tags: string[];
  
  metadata: {
    createdAt: string;
    updatedAt: string;
    author: string;
    version: number;
    estimatedTime: number;
  };
  
  curriculum?: {
    grade: number;
    unit: string;
    lessonNumber: number;
  };
  
  content: any;
  answer: any;
  explanation?: string;
  hints?: string[];
  
  scoring: {
    maxPoints: number;
    partialCredit: boolean;
  };
}
```

#### ディレクトリ構造

```
/public/data/
├── index.json                 # 全問題インデックス
├── metadata/
│   ├── categories.json
│   ├── tags.json
│   └── curriculum.json
│
├── geometry/
│   ├── problems/
│   │   ├── beginner/
│   │   ├── intermediate/
│   │   └── advanced/
│   └── assets/
│
├── english/
│   ├── vocabulary/
│   ├── listening/
│   ├── grammar/
│   └── reading/
│
└── shared/
    ├── images/
    ├── audio/
    └── videos/
```

#### タスク
- [ ] データスキーマの完全定義
- [ ] バリデーションスクリプト
- [ ] マイグレーションツール
- [ ] インデックス自動生成
- [ ] メタデータ管理システム

---

### **Phase 4: 学習アプリ統合** 📋 計画中

**期間**: 2026年9月 - 2026年11月  
**目標**: シームレスな学習体験の実現

#### フロントエンド機能

##### 問題表示システム
- [ ] GeometryViewer コンポーネント
- [ ] AudioPlayer コンポーネント
- [ ] QuizRenderer コンポーネント
- [ ] 動的問題ローディング

##### インタラクティブ要素
- [ ] 選択式問題UI
- [ ] 記述式入力
- [ ] ドラッグ&ドロップ
- [ ] 音声再生コントロール

##### フィードバック機能
- [ ] リアルタイム採点
- [ ] 詳細な解説表示
- [ ] ヒント機能
- [ ] 進捗可視化

#### バックエンド機能
- [ ] 問題ローディングAPI
- [ ] 進捗データ保存
- [ ] 学習分析エンジン
- [ ] レコメンデーション

---

### **Phase 5: 高度な機能** 📋 将来

**期間**: 2026年12月以降  
**目標**: AI駆動の個別最適化学習

#### AI機能
- [ ] 自動問題生成
- [ ] 学習パス最適化
- [ ] 弱点分析
- [ ] パーソナライズドレコメンド

#### 共同編集機能
- [ ] リアルタイム共同編集
- [ ] コメント・レビュー機能
- [ ] バージョン管理
- [ ] 承認ワークフロー

#### 分析・可視化
- [ ] 学習分析ダッシュボード
- [ ] 教師用管理画面
- [ ] レポート生成
- [ ] A/Bテスト基盤

---

## 🔧 技術スタック

### オーサリングツール（管理者用）
```
- HTML5 + CSS3
- TypeScript
- SVG/Canvas API
- Web Audio API
- AI API統合（OpenAI, Stable Diffusion）
```

### 学習アプリ（ユーザー用）
```
Frontend:
- React/TypeScript
- Vite
- TailwindCSS
- Framer Motion

Data:
- JSON files
- IndexedDB (オフライン対応)

Deploy:
- GitHub Pages
- Vercel/Netlify (将来)
```

### データ管理
```
Current:
- GitHub (バージョン管理)
- JSON files (データ保存)

Future Options:
- Firebase/Supabase (クラウド化)
- PostgreSQL (リレーショナルDB)
```

---

## 📊 運用モデル

### オプション A: 完全オフライン型（現在）
```
配布方法: ZIPファイル
データ管理: Git
デプロイ: 手動
コスト: ¥0
```

**メリット**:
- シンプル
- 初期コスト0
- 完全なコントロール

**デメリット**:
- 共同作業が難しい
- スケーラビリティに限界

### オプション B: ハイブリッド型（推奨）
```
オーサリング: ローカルツール
データ管理: GitHub
配信: GitHub Pages + CI/CD
学習: Webアプリ
コスト: ¥0 - ¥500/月
```

**メリット**:
- 低コスト
- バージョン管理
- 自動デプロイ
- 適度な柔軟性

**デメリット**:
- Gitの学習コスト
- リアルタイム性に制限

### オプション C: フルクラウド型（将来）
```
オーサリング: Webベース + 認証
データ管理: Firebase/Supabase
配信: Vercel + CDN
学習: フルスタックアプリ
コスト: ¥3,000 - ¥10,000/月
```

**メリット**:
- リアルタイム共同編集
- スケーラブル
- 高機能

**デメリット**:
- コスト増
- 複雑性増
- ベンダーロックイン

---

## 📈 成功指標（KPI）

### Phase 1-2（基盤構築期）
- [ ] 幾何問題 50問作成
- [ ] 英語問題 200問作成
- [ ] オーサリングツール 3種類完成
- [ ] データ品質 95%以上

### Phase 3-4（統合期）
- [ ] 月間アクティブユーザー 100人
- [ ] 平均学習時間 30分/日
- [ ] 問題完了率 80%以上
- [ ] ユーザー満足度 4.0/5.0以上

### Phase 5（成熟期）
- [ ] 総問題数 1,000問以上
- [ ] 月間アクティブユーザー 1,000人
- [ ] AI生成問題比率 30%
- [ ] 個別最適化精度 90%以上

---

## 🚧 リスクと対策

### 技術的リスク
| リスク | 影響 | 対策 |
|--------|------|------|
| AI API コスト増 | 高 | フリーモデル優先、キャッシング |
| パフォーマンス低下 | 中 | 段階的最適化、CDN活用 |
| ブラウザ互換性 | 低 | モダンブラウザに限定 |

### 運用リスク
| リスク | 影響 | 対策 |
|--------|------|------|
| コンテンツ作成遅延 | 高 | テンプレート化、AI活用 |
| データ品質低下 | 高 | 自動検証、レビュー体制 |
| ユーザー離脱 | 中 | エンゲージメント分析 |

---

## 🔗 関連ドキュメント

### 既存のロードマップ・計画書
- [DATA_QUALITY_REPORT.md](./guidelines/DATA_QUALITY_REPORT.md) - データ品質改善計画
- [PASSAGE_CREATION_GUIDELINES.md](./guidelines/passage/PASSAGE_CREATION_GUIDELINES.md) - パッセージ作成ロードマップ
- [GRAMMAR_QUALITY_PIPELINE.md](./guidelines/grammar/GRAMMAR_QUALITY_PIPELINE.md) - 文法問題品質管理

### 技術仕様
- [CROSS_FILE_CONSISTENCY.md](./guidelines/CROSS_FILE_CONSISTENCY.md)
- [DATA_QUALITY_ASSURANCE.md](./guidelines/DATA_QUALITY_ASSURANCE.md)

### 開発ガイドライン
- [CSS_COLOR_BEST_PRACTICES.md](./development/CSS_COLOR_BEST_PRACTICES.md)
- [GRAMMAR_GENERATION_GUIDELINES.md](./guidelines/grammar/GRAMMAR_GENERATION_GUIDELINES.md)

---

## 📝 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-12-08 | 1.0 | 初版作成 - 全体構成とPhase 1-5の計画 |

---

## 👥 貢献者

このロードマップは継続的に更新されます。フィードバックや提案は Issue または Pull Request でお願いします。

---

**次のアクション**: [Phase 1 タスクリスト](./PHASE_1_TASKS.md)
