# 読解データ手動修正ガイド

作成日: 2025年11月19日

## 📋 修正が必要な項目一覧

### 1. ComprehensiveReadingView.tsx の重複表示問題

**ファイル**: `src/components/ComprehensiveReadingView.tsx`  
**行番号**: 882-889行目

**問題**: フレーズの訳を表示した後、その下に単語の意味が重複表示される

**修正方法**:
以下のコードブロックを**削除**してください:

```tsx
<div className="word-meanings">
  {phrase.segments?.filter(s => s.meaning && s.meaning !== '-').map((seg, idx) => (
    <span key={idx} className="word-meaning-pair">
      <strong>{seg.word}</strong>: {seg.meaning}
    </span>
  ))}
</div>
```

修正後は以下のようになります:

```tsx
{phraseTranslations[phraseIdx] ? (
  <div className="phrase-translation visible">
    <div className="translation-text">{phrase.phraseMeaning}</div>
  </div>
) : (
```

---

## 2. reading-passages-dictionary.json の固有名詞誤記

**ファイル**: `public/data/reading-passages-dictionary.json`

**問題**: 一般名詞が「（固有名詞）」とマークされている（376個）

### 修正が必要な主要エントリ（アルファベット順）

各エントリの `meaning` フィールドを修正してください。また、必要に応じて `reading` フィールドも追加してください。

#### A-C

| 単語 | 現在の意味 | 修正後の意味 | 読み（追加推奨） |
|------|-----------|-------------|-----------------|
| Biomass | Biomass（固有名詞） | バイオマス（生物資源） | バイオマス |
| Biofuels | Biofuels（固有名詞） | バイオ燃料 | バイオフューエル |
| But | But（固有名詞） | しかし | バット |
| Cap | Cap（固有名詞） | 上限・キャップ | キャップ |
| Coal | Coal（固有名詞） | 石炭 | コール |
| Coastal | Coastal（固有名詞） | 沿岸の | コースタル |
| Compost | Compost（固有名詞） | 堆肥 | コンポスト |
| Composting | Composting（固有名詞） | 堆肥化 | コンポスティング |

#### D-G

| 単語 | 現在の意味 | 修正後の意味 | 読み（追加推奨） |
|------|-----------|-------------|-----------------|
| Dams | Dams（固有名詞） | ダム（複数形） | ダムズ |
| Ecosystems | Ecosystems（固有名詞） | 生態系（複数形） | エコシステムズ |
| Electric | Electric（固有名詞） | 電気の | エレクトリック |
| EVs | EVs（固有名詞） | 電気自動車（複数形） | イーヴイーズ |
| Fresh | Fresh（固有名詞） | 新鮮な | フレッシュ |
| Geothermal | Geothermal（固有名詞） | 地熱の | ジオサーマル |

#### H-M

| 単語 | 現在の意味 | 修正後の意味 | 読み（追加推奨） |
|------|-----------|-------------|-----------------|
| Hydroelectric | Hydroelectric（固有名詞） | 水力発電の | ハイドロエレクトリック |
| Ice | Ice（固有名詞） | 氷 | アイス |
| Incentives | Incentives（固有名詞） | インセンティブ（複数形） | インセンティブズ |
| Integrating | Integrating（固有名詞） | 統合する | インテグレイティング |
| LED | LED（固有名詞） | LED（発光ダイオード） | エルイーディー |
| Manufacturers | Manufacturers（固有名詞） | 製造業者（複数形） | マニュファクチャラーズ |
| Mondays | Mondays（固有名詞） | 月曜日（複数形） | マンデイズ |
| Monoculture | Monoculture（固有名詞） | 単一栽培 | モノカルチャー |

#### O-S

| 単語 | 現在の意味 | 修正後の意味 | 読み（追加推奨） |
|------|-----------|-------------|-----------------|
| Offshore | Offshore（固有名詞） | 沖合の | オフショア |
| Optimizing | Optimizing（固有名詞） | 最適化する | オプティマイジング |
| Orientation | Orientation（固有名詞） | 方向・向き | オリエンテーション |
| Overhangs | Overhangs（固有名詞） | 張り出し（複数形） | オーバーハングズ |
| Passive | Passive（固有名詞） | 受動的な | パッシブ |
| Plastic | Plastic（固有名詞） | プラスチック | プラスティック |
| Regenerative | Regenerative（固有名詞） | 再生の | リジェネラティブ |
| Regulations | Regulations（固有名詞） | 規制（複数形） | レギュレーションズ |
| Renewable | Renewable（固有名詞） | 再生可能な | リニューアブル |
| Retrofitting | Retrofitting（固有名詞） | 改修 | レトロフィッティング |
| Rooftop | Rooftop（固有名詞） | 屋上 | ルーフトップ |
| Simply | Simply（固有名詞） | 単に | シンプリ |
| Solar | Solar（固有名詞） | 太陽の | ソーラー |
| Species | Species（固有名詞） | 種（複数形） | スピーシーズ |
| Subsidies | Subsidies（固有名詞） | 補助金（複数形） | サブシディーズ |
| Sunny | Sunny（固有名詞） | 晴れた | サニー |
| **Sustainability** | **Sustainability（固有名詞）** | **持続可能性** | **サステナビリティ** |

#### T-Z

| 単語 | 現在の意味 | 修正後の意味 | 読み（追加推奨） |
|------|-----------|-------------|-----------------|
| Thermal | Thermal（固有名詞） | 熱の | サーマル |
| Together | Together（固有名詞） | 一緒に | トゥゲザー |
| Tool | Tool（固有名詞） | 道具 | トゥール |
| Traditional | Traditional（固有名詞） | 伝統的な | トラディショナル |
| Triple | Triple（固有名詞） | 3倍の | トリプル |
| Upgrading | Upgrading（固有名詞） | アップグレード | アップグレイディング |
| VOC | VOC（固有名詞） | VOC（揮発性有機化合物） | ヴイオーシー |
| Walkable | Walkable（固有名詞） | 歩きやすい | ウォーカブル |

### 真の固有名詞（修正不要）

以下は実際に固有名詞なので、そのまま残してください:
- Denmark（デンマーク）
- Iceland（アイスランド）
- その他の国名・地名・人名

---

## 3. パッセージファイルのフレーズ訳（日本語の読点修正）

### Advanced-1.json の修正

**ファイル**: `public/data/advanced-1.json`

#### phrase-3
- **現在**: `"気候変動資源枯渇汚染は緊急の行動を必要とします"`
- **修正後**: `"気候変動、資源枯渇、汚染は緊急の行動を必要とします"`

#### phrase-15
- **現在**: `"ハリケーン干ばつ洪水山火事が激化しています"`
- **修正後**: `"ハリケーン、干ばつ、洪水、山火事が激化しています"`

### Intermediate-5.json の修正

**ファイル**: `public/data/intermediate-5.json`

#### phrase-2 (要確認)
- **現在**: `"あなたのキャリアはライフスタイル収入幸福に影響します"`
- **修正後**: `"あなたのキャリアはライフスタイル、収入、幸福に影響します"`

### Advanced-3.json の修正

**ファイル**: `public/data/advanced-3.json`

#### phrase-2 (要確認)
- **現在**: `"異なる文化言語そして伝統"`
- **修正後**: `"異なる文化、言語、そして伝統"`

---

## 4. ピリオドの格納確認

現在のデータ構造では、ピリオドは `words` 配列の最後の要素に含まれています:

```json
"words": ["Climate", "change", "resource", "depletion", "and", "pollution", "require", "urgent", "action", "."]
```

これは**正しい**実装です。カード内に正しく表示されているはずです。

もしピリオドが表示されていない場合は、CSS の問題の可能性があります。
`ComprehensiveReadingView.tsx` の `.punctuation-card` スタイルを確認してください。

---

## 📝 修正手順

### 手順1: ComprehensiveReadingView.tsx の修正

1. `src/components/ComprehensiveReadingView.tsx` を開く
2. 882-889行目の `<div className="word-meanings">...</div>` ブロック全体を削除
3. 保存

### 手順2: reading-passages-dictionary.json の修正

1. `public/data/reading-passages-dictionary.json` を開く
2. 上記の表を参照して、各エントリの `meaning` と `reading` を修正
3. 検索機能を使うと効率的です（例: `"sustainability"` で検索）
4. 保存

### 手順3: パッセージファイルの修正

1. 各パッセージファイルを開く（`advanced-1.json`, `intermediate-5.json` など）
2. 上記の問題フレーズを検索して修正
3. 他にも読点が欠けているフレーズがないか確認
4. 保存

### 手順4: 動作確認

1. `npm run build` でビルド
2. `npm run dev` で開発サーバー起動
3. 読解機能を開いて以下を確認:
   - フレーズ訳表示時に単語の意味が重複していないか
   - 日本語訳が自然か
   - 単語の詳細で固有名詞マークが適切か

---

## 🔍 全パッセージの日本語訳チェックポイント

以下のパターンに該当するフレーズは要確認:

1. **並列要素に読点がない**
   - 例: `"A B C"`  → `"A、B、C"`
   
2. **長い文で息継ぎがない**
   - 適切な位置に読点を追加

3. **助詞の欠落**
   - 例: `"〜について知る必要あります"` → `"〜について知る必要があります"`

---

## ✅ 修正完了チェックリスト

- [ ] ComprehensiveReadingView.tsx の重複表示削除
- [ ] reading-passages-dictionary.json の Sustainability 修正
- [ ] reading-passages-dictionary.json のその他の固有名詞誤記修正（主要40個以上）
- [ ] advanced-1.json の phrase-3, phrase-15 修正
- [ ] intermediate-5.json の phrase-2 修正
- [ ] advanced-3.json の phrase-2 修正
- [ ] 全パッセージファイルの日本語訳を目視確認
- [ ] ビルド・動作確認

---

**注意**: 修正作業は慎重に行い、JSON形式を崩さないようにしてください。
各修正後にファイルを保存し、JSONの構文エラーがないか確認することをお勧めします。
