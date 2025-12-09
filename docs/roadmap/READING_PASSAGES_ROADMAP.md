# 長文読解機能 改良ロードマップ

## 概要
現状の長大なパッセージ（4000語超）を学習しやすい適切な長さに再構成し、多様な形式と図表を含む総合的な読解練習環境を構築する。

---

## 現状の課題

### 1. パッセージの問題点
- **語数過多**: 一部のパッセージが4000語超、1600行超
- **翻訳対応の困難**: 行数が多すぎて対応関係の管理が複雑
- **学習者の負担**: 完走が難しく、モチベーション低下の原因
- **データ管理**: ファイルサイズが大きく、処理に時間がかかる

### 2. コンテンツの単調さ
- パッセージタイプが物語・説明文に偏っている
- 実践的な形式（メール、チャート説明など）が不足
- ビジュアル要素（図表、グラフ）の欠如

---

## Phase 1: 設計と仕様策定 【優先度: 高】

### 1.1 パッセージ分類の再定義
**目標**: 学習段階に応じた適切な語数設定

| レベル | 語数範囲 | 推奨行数 | 想定時間 | 特徴 |
|--------|----------|----------|----------|------|
| 入門 | 100-300語 | 20-60行 | 5-10分 | 日常会話、簡単な説明 |
| 初級 | 300-500語 | 60-100行 | 10-15分 | 短い物語、手順説明 |
| 中級 | 500-700語 | 100-140行 | 15-20分 | ニュース記事、エッセイ |
| 上級 | 700-1000語 | 140-200行 | 20-30分 | 学術的文章、複雑な議論 |

### 1.2 パッセージタイプの多様化
**実装するタイプ**:

#### A. テキスト形式
- [ ] 会話/ダイアログ（2-3人の対話）
- [ ] 物語/ナラティブ（時系列のストーリー）
- [ ] 説明文/解説（プロセス、仕組みの説明）
- [ ] 論説文/意見文（主張と根拠）
- [ ] ニュース記事（5W1H形式）

#### B. 実践的形式
- [ ] ビジネスメール（依頼、報告、提案）
- [ ] 手紙/招待状（フォーマル・インフォーマル）
- [ ] 広告/案内文（イベント、製品紹介）
- [ ] レビュー/評価（製品、サービス、書籍）
- [ ] レシピ/手順書（料理、組み立て）

#### C. 図表付き文章
- [ ] グラフ説明（棒グラフ、円グラフ、折れ線グラフ）
- [ ] 表の読解（データ比較、統計）
- [ ] フローチャート（プロセス、判断木）
- [ ] 地図/案内図（道順、施設配置）
- [ ] インフォグラフィック（視覚的データ表現）

### 1.3 データ構造の拡張
**新しいReadingPassage型定義**:

```typescript
interface VisualElement {
  id: string;
  type: 'chart' | 'table' | 'diagram' | 'map' | 'image' | 'infographic';
  position: number; // フレーズIDの後に表示
  data: ChartData | TableData | DiagramData | MapData | ImageData;
  caption: {
    english: string;
    japanese: string;
  };
  explanation?: {
    english: string;
    japanese: string;
  };
}

interface ChartData {
  chartType: 'bar' | 'line' | 'pie' | 'scatter';
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
  }[];
}

interface TableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

interface ReadingPassage {
  // 既存フィールド
  id: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  actualWordCount: number;
  
  // 新規フィールド
  passageType: 'dialogue' | 'narrative' | 'explanation' | 'opinion' | 'news' | 
                'email' | 'letter' | 'advertisement' | 'review' | 'recipe';
  estimatedTime: number; // 分単位
  visualElements?: VisualElement[];
  comprehensionQuestions?: ComprehensionQuestion[];
  
  // 既存のphrases配列
  phrases: Phrase[];
  translation?: string;
}

interface ComprehensionQuestion {
  id: string;
  question: string;
  questionJa: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  explanationJa?: string;
}
```

---

## Phase 2: 既存パッセージの最適化 【優先度: 高】

### 2.1 長大パッセージの分割
**対象**: 2000語以上のパッセージ

| 現在のファイル | 語数 | 分割案 | 新語数 |
|----------------|------|--------|--------|
| advanced_4493_Family-Gathering-Traditions | 4493語 | 5-6パートに分割 | 各700-900語 |
| advanced_4419_School-Festival-Planning | 4419語 | 5-6パートに分割 | 各700-800語 |
| intermediate_3799_Cultural-Festival-Planning | 3799語 | 4-5パートに分割 | 各750-950語 |

**分割方針**:
- ストーリーの自然な区切りで分割
- 各パートが独立して理解可能
- タイトルに Part 1, Part 2 などを付記

### 2.2 翻訳データの再生成
**アプローチ**:
1. 分割後の各パートについて
2. 適切な長さ（200行以下）の英文
3. 対応する日本語フレーズ訳を生成
4. 段落形式の全訳を作成

**スクリプト作成**:
```bash
scripts/
  split_long_passages.py      # 長文を分割
  regenerate_translations.py  # 翻訳を再生成
  validate_alignment.py       # 英日対応を検証
```

---

## Phase 3: 新規パッセージの作成 【優先度: 中】

### 3.1 入門レベル（100-300語）
**作成するパッセージ**: 各タイプ3-5個

- [ ] 自己紹介の会話
- [ ] レストランでの注文
- [ ] 道案内のダイアログ
- [ ] 簡単な日記
- [ ] 天気予報の説明

### 3.2 初級レベル（300-500語）
- [ ] 週末の予定についての会話
- [ ] 買い物体験のストーリー
- [ ] 趣味の紹介文
- [ ] 簡単なレシピ
- [ ] イベント招待メール

### 3.3 中級レベル（500-700語）
- [ ] 旅行記
- [ ] 製品レビュー
- [ ] ニュース記事（地域イベント）
- [ ] 意見文（環境問題など）
- [ ] ビジネスメール（提案書）

### 3.4 上級レベル（700-1000語）
- [ ] 学術的エッセイ
- [ ] 詳細なプロセス説明
- [ ] 複数の視点を持つ議論
- [ ] 研究報告の要約
- [ ] 文化比較の論文

---

## Phase 4: 図表機能の実装 【優先度: 中】

### 4.1 Chart.js統合
**インストール**:
```bash
npm install chart.js react-chartjs-2
```

**実装するチャートタイプ**:
- [ ] 棒グラフ（Bar Chart）
- [ ] 円グラフ（Pie Chart）
- [ ] 折れ線グラフ（Line Chart）
- [ ] 散布図（Scatter Plot）

### 4.2 テーブルコンポーネント
```typescript
// components/reading/DataTable.tsx
interface DataTableProps {
  data: TableData;
  className?: string;
}

export function DataTable({ data }: DataTableProps) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            {data.headers.map((header, i) => (
              <th key={i} className="border px-4 py-2">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border px-4 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.caption && (
        <p className="text-sm text-gray-600 mt-2">{data.caption}</p>
      )}
    </div>
  );
}
```

### 4.3 図表付きパッセージの例
**テーマ**: 「会社の売上分析レポート」

```json
{
  "id": "intermediate-sales-report",
  "title": "Quarterly Sales Report",
  "level": "intermediate",
  "passageType": "explanation",
  "actualWordCount": 580,
  "visualElements": [
    {
      "id": "chart1",
      "type": "chart",
      "position": 5,
      "data": {
        "chartType": "bar",
        "title": "Quarterly Sales by Region",
        "labels": ["Q1", "Q2", "Q3", "Q4"],
        "datasets": [
          {
            "label": "North",
            "data": [120, 150, 180, 200]
          },
          {
            "label": "South",
            "data": [100, 130, 145, 160]
          }
        ]
      },
      "caption": {
        "english": "Figure 1: Sales performance across regions",
        "japanese": "図1: 地域別売上実績"
      }
    }
  ]
}
```

---

## Phase 5: UI/UX改善 【優先度: 中】

### 5.1 読解進捗の可視化
**実装機能**:
- [ ] 進捗バー（現在位置 / 総フレーズ数）
- [ ] 推定残り時間の表示
- [ ] 読了パッセージの記録と表示

```typescript
// components/reading/ProgressBar.tsx
interface ProgressBarProps {
  current: number;
  total: number;
  estimatedTime: number;
}

export function ProgressBar({ current, total, estimatedTime }: ProgressBarProps) {
  const percentage = (current / total) * 100;
  const remainingTime = Math.ceil((estimatedTime * (total - current)) / total);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span>{current} / {total} フレーズ</span>
        <span>残り約 {remainingTime} 分</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

### 5.2 理解度チェック機能
**実装**:
- [ ] 各パッセージ後の理解度テスト（3-5問）
- [ ] 選択式問題
- [ ] 正答率の表示とフィードバック

### 5.3 フィルタリング・検索機能
**実装**:
- [ ] パッセージタイプでフィルター
- [ ] 語数範囲でフィルター
- [ ] 所要時間でフィルター
- [ ] 未読/既読でフィルター

```typescript
interface PassageFilters {
  level?: 'beginner' | 'intermediate' | 'advanced';
  type?: PassageType;
  wordCountRange?: [number, number];
  timeRange?: [number, number];
  status?: 'unread' | 'in-progress' | 'completed';
}
```

---

## Phase 6: コンテンツ管理システム 【優先度: 低】

### 6.1 パッセージエディター
**機能**:
- [ ] ブラウザベースのエディター
- [ ] リアルタイムプレビュー
- [ ] 語数自動カウント
- [ ] フレーズ分割の視覚的編集
- [ ] 翻訳入力支援

### 6.2 図表エディター
**機能**:
- [ ] チャートデータの入力UI
- [ ] プレビュー機能
- [ ] JSONエクスポート

### 6.3 バリデーション機能
**チェック項目**:
- [ ] 英文とフレーズ訳の行数一致
- [ ] 語数が指定範囲内
- [ ] 必須フィールドの存在
- [ ] 図表データの整合性

---

## Phase 7: データ移行とクリーンアップ 【優先度: 高】

### 7.1 移行スクリプト作成
```python
# scripts/migrate_passages.py
# 既存データを新フォーマットに変換

def migrate_passage(old_passage_path):
    # 1. 既存JSONを読み込み
    # 2. 新しいスキーマに変換
    # 3. 語数チェック（超過なら警告）
    # 4. 新フォーマットで保存
    pass
```

### 7.2 翻訳ファイルの整理
**ディレクトリ構造**:
```
public/data/
  passages/                    # 表示用パッセージ
    beginner/
      beginner_250_self-introduction.txt
    intermediate/
    advanced/
  
  passages-phrase-learning/    # フレーズ学習用JSON
    beginner/
      beginner_250_self-introduction.json
    intermediate/
    advanced/
  
  passages-translations/       # 翻訳ファイル
    beginner/
      beginner_250_self-introduction-phrases.txt  # 行対応
      beginner_250_self-introduction-full.txt     # 全訳
    intermediate/
    advanced/
  
  passages-visuals/           # 図表データ
    charts/
    tables/
    diagrams/
```

### 7.3 不要ファイルの削除
- [ ] バックアップファイル（*.backup）
- [ ] 重複ファイル
- [ ] 未使用の翻訳ファイル

---

## 実装スケジュール

### Week 1-2: Phase 1（設計）
- [x] 仕様書作成
- [ ] データ構造の確定
- [ ] 型定義の実装

### Week 3-4: Phase 2（既存データ最適化）
- [ ] 長文分割スクリプト作成
- [ ] 分割実行
- [ ] 翻訳再生成

### Week 5-6: Phase 3（新規コンテンツ）
- [ ] 入門レベル 10パッセージ作成
- [ ] 初級レベル 10パッセージ作成

### Week 7-8: Phase 4（図表機能）
- [ ] Chart.js統合
- [ ] テーブルコンポーネント実装
- [ ] 図表付きサンプル 5個作成

### Week 9-10: Phase 5（UI改善）
- [ ] 進捗バー実装
- [ ] 理解度テスト機能
- [ ] フィルター機能

### Week 11-12: Phase 7（移行・クリーンアップ）
- [ ] データ移行実行
- [ ] テスト
- [ ] リリース

---

## 成功指標（KPI）

### 学習体験
- [ ] パッセージ完走率: 80%以上
- [ ] 平均学習時間: 設定時間の±20%以内
- [ ] 理解度テスト正答率: 70%以上

### コンテンツ
- [ ] 各レベル最低20パッセージ
- [ ] 8種類以上のパッセージタイプ
- [ ] 図表付きパッセージ: 10個以上

### 技術
- [ ] ページロード時間: 2秒以内
- [ ] 翻訳対応エラー: 0件
- [ ] モバイル対応: 完全レスポンシブ

---

## リスクと対策

### リスク1: 翻訳品質の低下
**対策**: 
- ネイティブチェックの実施
- 機械翻訳後の手動校正
- ユーザーフィードバック機能

### リスク2: 開発工数の超過
**対策**:
- フェーズ分割で段階的リリース
- 優先度の明確化
- 自動化スクリプトの活用

### リスク3: データ移行時のエラー
**対策**:
- 移行前の完全バックアップ
- 段階的移行とテスト
- ロールバック計画の策定

---

## 次のアクション

1. **即座に実行**:
   - [ ] このロードマップをチームで共有・合意
   - [ ] Phase 1の型定義を実装
   - [ ] 長文分割スクリプトの作成開始

2. **今週中**:
   - [ ] advanced_4493_Family-Gathering-Traditionsを5パートに分割
   - [ ] 分割後の各パートの翻訳生成
   - [ ] 動作確認

3. **来週**:
   - [ ] 入門レベルパッセージ5個作成
   - [ ] Chart.jsの検証と導入決定
   - [ ] 進捗バーのプロトタイプ実装

---

**最終更新**: 2025年12月9日
**ステータス**: 設計フェーズ
**次回レビュー**: Phase 2完了後
