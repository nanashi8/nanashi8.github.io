# 長文読解機能 実装計画書

## 📋 概要
長文読解機能の段階的実装計画。ユーザー体験を向上させる14の機能を7つのフェーズに分けて実装します。

---

## 🎯 Phase 1: 全文タブ - 選択文の詳細表示機能
**優先度**: ⭐⭐⭐ (最優先)  
**実装期間**: 2-3日  
**依存関係**: なし

### 実装項目
1. **選択した文の単語を分解表示（カード形式）**
   - 文を単語に分解
   - 既存のword-cardコンポーネントを再利用
   - フレーズ認識機能の適用

2. **各単語の意味を表示**
   - 辞書データから意味を取得
   - カード内に意味を表示
   - 表示/非表示トグル機能

3. **文法構造の簡易表示（S, V, O等）**
   - 基本的な品詞タグ付け
   - SVOCパターンの自動検出
   - 視覚的な色分け表示

4. **選択した文だけの発音ボタン**
   - Web Speech API使用
   - 再生/停止/一時停止機能
   - 速度調整オプション

### 技術仕様
```typescript
// 新規State
const [selectedSentence, setSelectedSentence] = useState<{
  text: string;
  index: number;
  words: ReadingSegment[];
  structure: GrammarTag[];
} | null>(null);

// 文法タグの型定義
type GrammarTag = {
  word: string;
  tag: 'S' | 'V' | 'O' | 'C' | 'M' | 'Prep' | 'Conj';
  color: string;
};
```

### ファイル変更
- `src/components/ComprehensiveReadingView.tsx` (主要実装)
- `src/App.css` (スタイル追加)
- `src/utils/grammarAnalyzer.ts` (新規作成 - 文法解析)

---

## 🎯 Phase 2: 単語保存機能の強化
**優先度**: ⭐⭐⭐  
**実装期間**: 2-3日  
**依存関係**: Phase 1

### 実装項目
5. **フロート詳細表示の保存ボタン**
   - 単語ポップアップに保存ボタン追加
   - カスタム単語集への追加

6. **カスタム単語集の作成・管理**
   - 長文タイトル_カスタム単語集の作成
   - 形式: `{passageTitle}_custom_wordlist.json`
   - LocalStorageに保存

7. **保存した単語の編集機能**
   - 単語リストの表示UI
   - 個別削除機能
   - 意味の編集機能
   - エクスポート/インポート機能

### 技術仕様
```typescript
// カスタム単語集の型定義
type CustomWordList = {
  passageId: string;
  passageTitle: string;
  createdAt: string;
  updatedAt: string;
  words: {
    word: string;
    meaning: string;
    reading: string;
    context: string; // どの文で出現したか
    savedAt: string;
    notes?: string; // ユーザーメモ
  }[];
};
```

### ファイル変更
- `src/components/ComprehensiveReadingView.tsx`
- `src/utils/customWordListManager.ts` (新規作成)
- `src/components/CustomWordListEditor.tsx` (新規作成)

---

## 🎯 Phase 3: 読解タブのナビゲーション改善
**優先度**: ⭐⭐  
**実装期間**: 1-2日  
**依存関係**: なし

### 実装項目
8. **プログレスバー追加**
   - 現在位置の表示（例: "3/12 フレーズ"）
   - 視覚的なプログレスバー
   - 完了率の表示

9. **キーボード左右キーでフレーズ移動**
   - `useEffect`でキーボードイベントリスナー登録
   - 左キー: 前のフレーズ
   - 右キー: 次のフレーズ
   - フォーカス管理

10. **段階的表示（英文→単語の意味→フレーズ訳）**
    - 3段階の表示モード
    - 「次へ」ボタンで段階的に表示
    - 状態管理の追加

### 技術仕様
```typescript
// 段階的表示の状態管理
type DisplayStage = 'english' | 'wordMeanings' | 'phraseTranslation';
const [currentStage, setCurrentStage] = useState<DisplayStage>('english');

// キーボードイベント
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePreviousPhrase();
    if (e.key === 'ArrowRight') handleNextPhrase();
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [currentPhraseIndex]);
```

### ファイル変更
- `src/components/ComprehensiveReadingView.tsx`
- `src/App.css`

---

## 🎯 Phase 4: 音声機能の拡張
**優先度**: ⭐⭐  
**実装期間**: 2-3日  
**依存関係**: なし

### 実装項目
11. **フレーズ訳の読み上げ機能（日本語TTS）**
    - Web Speech APIの日本語音声
    - 速度調整機能
    - 音声選択機能

12. **英語→日本語の連続再生**
    - 英語フレーズ再生後、自動で日本語訳再生
    - 再生間隔の調整
    - ループ機能

### 技術仕様
```typescript
// 日本語音声合成
const speakJapanese = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.9; // 速度調整
  speechSynthesis.speak(utterance);
};

// 連続再生
const speakBothLanguages = async (english: string, japanese: string) => {
  await speakEnglish(english);
  await new Promise(resolve => setTimeout(resolve, 500)); // 0.5秒の間隔
  await speakJapanese(japanese);
};
```

### ファイル変更
- `src/speechSynthesis.ts` (拡張)
- `src/components/ComprehensiveReadingView.tsx`

---

## 🎯 Phase 5: 全訳タブの改善
**優先度**: ⭐  
**実装期間**: 1日  
**依存関係**: なし

### 実装項目
13. **英文と全訳を一文ずつ交互に並べて表示**
    - パラレル表示モード
    - 文単位での対応表示
    - スクロール同期オプション

### 技術仕様
```typescript
// パラレル表示コンポーネント
const ParallelTextDisplay = ({ sentences, translations }) => {
  return (
    <div className="parallel-display">
      {sentences.map((sentence, idx) => (
        <div key={idx} className="sentence-pair">
          <div className="english-sentence">{sentence}</div>
          <div className="japanese-sentence">{translations[idx]}</div>
        </div>
      ))}
    </div>
  );
};
```

### ファイル変更
- `src/components/ComprehensiveReadingView.tsx`
- `src/App.css`

---

## 🎯 Phase 6: 学習履歴管理
**優先度**: ⭐⭐  
**実装期間**: 2-3日  
**依存関係**: なし

### 実装項目
14. **LocalStorageスキーマ設計**
    - 学習履歴データ構造の定義
    - バージョン管理

15. **最後に読んだフレーズを記憶**
    - 自動保存機能
    - 再開時に復元

16. **読了フラグ**
    - パッセージ完了の検出
    - 完了マーク表示

17. **繰り返し学習回数・日時の記録**
    - 学習セッションの記録
    - 統計情報の表示

### 技術仕様
```typescript
// 学習履歴の型定義
type StudyHistory = {
  passageId: string;
  lastStudiedAt: string;
  lastPhraseIndex: number;
  completedAt?: string;
  isCompleted: boolean;
  studySessions: {
    startedAt: string;
    endedAt: string;
    phrasesStudied: number;
  }[];
  repeatCount: number; // 繰り返し回数
  totalTimeSpent: number; // 秒単位
};

// LocalStorageキー
const STUDY_HISTORY_KEY = 'reading-study-history';
```

### ファイル変更
- `src/utils/studyHistoryManager.ts` (新規作成)
- `src/components/ComprehensiveReadingView.tsx`
- `src/components/StudyStatistics.tsx` (新規作成 - 統計表示)

---

## 🎯 Phase 7: メモ機能
**優先度**: ⭐  
**実装期間**: 1-2日  
**依存関係**: Phase 6

### 実装項目
18. **フレーズごとのメモ保存**
    - メモ入力欄の追加
    - LocalStorageに保存

19. **メモの表示・編集UI**
    - メモアイコンの表示
    - モーダルまたはインライン編集
    - メモの削除機能

### 技術仕様
```typescript
// メモの型定義
type PhraseNote = {
  passageId: string;
  phraseId: number;
  note: string;
  createdAt: string;
  updatedAt: string;
};

// LocalStorageキー
const PHRASE_NOTES_KEY = 'reading-phrase-notes';
```

### ファイル変更
- `src/components/ComprehensiveReadingView.tsx`
- `src/utils/phraseNotesManager.ts` (新規作成)
- `src/App.css`

---

## 📊 実装スケジュール

```
Week 1-2:  Phase 1 (全文タブ詳細表示)
Week 3:    Phase 2 (単語保存機能)
Week 4:    Phase 3 (ナビゲーション改善)
Week 5:    Phase 4 (音声機能)
Week 6:    Phase 5 (全訳タブ改善)
Week 7-8:  Phase 6 (学習履歴管理)
Week 9:    Phase 7 (メモ機能)
```

---

## 🔧 技術スタック

### 既存技術
- React 18 (Hooks)
- TypeScript
- Web Speech API
- LocalStorage API

### 新規追加
- 文法解析ライブラリ（検討中: compromise.js または自作）
- 日本語TTS（Web Speech API内蔵）

---

## 📝 データ構造

### LocalStorage構造
```typescript
// reading-study-history
{
  "beginner-morning-routine": {
    "passageId": "beginner-morning-routine",
    "lastStudiedAt": "2025-12-10T10:30:00Z",
    "lastPhraseIndex": 5,
    "isCompleted": false,
    "studySessions": [...],
    "repeatCount": 3
  }
}

// reading-phrase-notes
{
  "beginner-morning-routine-phrase-3": {
    "note": "wake upは句動詞",
    "createdAt": "2025-12-10T10:30:00Z"
  }
}

// reading-custom-wordlists
{
  "beginner-morning-routine_custom": {
    "passageTitle": "My Morning Routine",
    "words": [...]
  }
}
```

---

## ✅ 完了基準

### Phase 1
- [ ] 選択文の単語カード表示が機能する
- [ ] 文法タグが正しく表示される
- [ ] 選択文の発音が機能する
- [ ] TypeScriptエラーなし
- [ ] モバイル対応

### Phase 2
- [ ] 単語ポップアップから保存できる
- [ ] カスタム単語集が作成される
- [ ] 保存した単語を編集できる
- [ ] LocalStorageに永続化される

### Phase 3
- [ ] プログレスバーが表示される
- [ ] キーボード操作が機能する
- [ ] 段階的表示が機能する

### Phase 4
- [ ] 日本語TTSが機能する
- [ ] 英日連続再生が機能する
- [ ] 速度調整が機能する

### Phase 5
- [ ] パラレル表示が機能する
- [ ] 文の対応が正しい

### Phase 6
- [ ] 学習履歴が保存される
- [ ] 再開時に復元される
- [ ] 統計が正しく表示される

### Phase 7
- [ ] メモが保存できる
- [ ] メモが表示される
- [ ] メモが編集できる

---

## 🚀 次のステップ

1. **Phase 1の実装開始**
   - 文法解析ロジックの実装
   - 選択文の詳細表示UI作成

2. **テストケースの作成**
   - 各フェーズのユニットテスト
   - E2Eテスト

3. **ドキュメント更新**
   - ユーザーガイドの作成
   - API仕様書の作成

---

## 📌 注意事項

- 各フェーズは独立して実装可能
- Phase 1とPhase 2は優先度が高い
- モバイル対応を常に考慮
- パフォーマンスに注意（特にLocalStorage）
- アクセシビリティを考慮
- ダークモード対応を忘れずに

---

**最終更新**: 2025年12月10日  
**作成者**: GitHub Copilot  
**ステータス**: 計画策定完了
