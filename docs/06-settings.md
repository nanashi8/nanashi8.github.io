# 06. 設定画面仕様書

## ⚙️ 概要

設定画面は、学習プラン、AI人格、表示モード、プライバシーポリシーなど、アプリ全体の設定を管理する画面です。ユーザーの学習スタイルや好みに合わせてカスタマイズできます。

### 主な機能

- **学習プラン設定**: 1〜6ヶ月の学習期間を設定し、1日の目標を自動計算
- **AI人格選択**: 4種類のAI教師キャラクターから選択
- **表示モード切り替え**: ライト/ダーク/システム自動切り替え
- **プライバシー情報**: データの保存場所とプライバシーポリシーへのリンク

---

## 🎯 機能仕様

### 1. 学習プラン設定

**関連分野（カテゴリ）仕様**: [19-junior-high-vocabulary.md](./19-junior-high-vocabulary.md) - 10カテゴリシステム

#### 学習期間選択

```typescript
// 選択可能な期間（月単位）
const PLAN_OPTIONS = [1, 2, 3, 6]; // 1ヶ月、2ヶ月、3ヶ月、6ヶ月

// 1日の目標単語数を自動計算
const dailyGoal = Math.ceil(totalWords / (planMonths * 30));
```

#### データ構造（LearningSchedule型）

```typescript
export interface LearningSchedule {
  userId: string;
  startDate: number;           // 開始日時（タイムスタンプ）
  currentDay: number;          // 現在の日数
  totalDays: number;           // 総日数（30, 60, 90, 180など）
  planDurationMonths: number;  // プラン期間（1, 2, 3, 6ヶ月）
  phase: 1 | 2 | 3;            // 学習フェーズ
  
  dailyGoals: {
    newWords: number;          // 1日の新出単語目標
    reviewWords: number;       // 1日の復習単語目標
    timeMinutes: number;       // 1日の学習時間目標（分）
  };
  
  weeklyProgress: {
    week: number;
    wordsLearned: number;
    // ... その他の週次進捗データ
  };
}
```

#### 計算ロジック

```typescript
// 総単語数: 1500語
// 選択期間: 3ヶ月（90日）
// 1日の目標: 1500 / 90 = 17語/日

const calculateDailyGoals = (totalWords: number, months: number) => {
  const totalDays = months * 30;
  const dailyNewWords = Math.ceil(totalWords / totalDays);
  const dailyReviewWords = Math.ceil(dailyNewWords * 0.5); // 新出の50%を復習
  const dailyTimeMinutes = Math.ceil(dailyNewWords * 2); // 1語あたり2分
  
  return {
    newWords: dailyNewWords,
    reviewWords: dailyReviewWords,
    timeMinutes: dailyTimeMinutes,
  };
};
```

---

### 2. AI人格選択

#### 4種類の人格

```typescript
export const PERSONALITY_INFO = {
  'kind-teacher': {
    avatar: '👩‍🏫',
    name: '優しい先生',
    description: '励ましと褒めを中心に、温かくサポート',
  },
  'strict-coach': {
    avatar: '💪',
    name: '厳しいコーチ',
    description: 'ストイックに鍛える。妥協なし',
  },
  'cheerful-friend': {
    avatar: '😊',
    name: '明るい友達',
    description: 'フレンドリーで楽しく学習をサポート',
  },
  'calm-mentor': {
    avatar: '🧘',
    name: '冷静なメンター',
    description: '論理的で客観的なアドバイス',
  },
};

export type AIPersonality = keyof typeof PERSONALITY_INFO;
```

#### 人格切り替えUI

```tsx
<div className="personality-grid">
  {(Object.entries(PERSONALITY_INFO) as [AIPersonality, ...][]
  ).map(([key, info]) => (
    <button
      key={key}
      className={`personality-card ${aiPersonality === key ? 'active' : ''}`}
      onClick={() => handlePersonalityChange(key)}
    >
      <div className="personality-avatar">{info.avatar}</div>
      <div className="personality-name">{info.name}</div>
      <div className="personality-desc">{info.description}</div>
    </button>
  ))}
</div>
```

#### LocalStorage保存

```typescript
const handlePersonalityChange = (personality: AIPersonality) => {
  setAIPersonality(personality);
  localStorage.setItem('aiPersonality', personality);
};

// 読み込み時
const [aiPersonality, setAIPersonality] = useState<AIPersonality>(() => {
  const saved = localStorage.getItem('aiPersonality');
  return (saved as AIPersonality) || 'kind-teacher';
});
```

---

### 3. 表示モード切り替え

#### 3つのモード

- **ライトモード** (`light`): 常に明るい表示
- **ダークモード** (`dark`): 常に暗い表示
- **システム自動** (`system`): OSの設定に追従

#### システムダークモード検出

```typescript
const applyDarkMode = (mode: 'light' | 'dark' | 'system') => {
  let isDark = false;
  if (mode === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDark = mode === 'dark';
  }
  document.documentElement.classList.toggle('dark-mode', isDark);
};
```

#### システム設定変更の監視

```typescript
useEffect(() => {
  applyDarkMode(darkMode);
  
  // システム設定の変更を監視
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    if (darkMode === 'system') {
      applyDarkMode('system');
    }
  };
  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}, [darkMode]);
```

#### 旧バージョンからの移行

```typescript
const [darkMode, setDarkMode] = useState<'light' | 'dark' | 'system'>(() => {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'system' || saved === 'light' || saved === 'dark') {
    return saved;
  }
  // 旧形式（boolean）からの移行
  if (saved === 'true') return 'dark';
  if (saved === 'false') return 'light';
  return 'system';
});
```

---

### 4. 音声設定（TranslationView内）

#### 音声合成API（speechSynthesis.ts）

```typescript
export function speakEnglish(
  text: string,
  options: {
    rate?: number;      // 速度 (0.1 - 10, デフォルト: 0.9)
    pitch?: number;     // ピッチ (0 - 2, デフォルト: 1.0)
    volume?: number;    // 音量 (0 - 1, デフォルト: 1.0)
    lang?: string;      // 言語 (デフォルト: 'en-US')
  } = {}
): void {
  if (!('speechSynthesis' in window)) {
    console.warn('このブラウザはWeb Speech APIをサポートしていません');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'en-US';
  utterance.rate = options.rate || 0.9;
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;

  utterance.onerror = (event) => {
    console.error('音声合成エラー:', event);
  };

  window.speechSynthesis.speak(utterance);
}
```

#### 音声機能

- **自動再生**: 問題表示時に単語を自動読み上げ（ON/OFF切り替え可能）
- **手動再生**: 🔊ボタンをクリックして再生
- **再生速度**: 0.9倍速（学習者向けにゆっくり）
- **対応言語**: en-US（アメリカ英語）

#### ブラウザサポート確認

```typescript
export function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window;
}

// UIでの利用例
{isSpeechSynthesisSupported() ? (
  <button onClick={() => speakEnglish(currentQuestion.word)}>
    🔊 発音
  </button>
) : (
  <p className="warning">このブラウザは音声機能に対応していません</p>
)}
```

---

### 5. プライバシー設定

#### データ保存場所

```tsx
<div className="privacy-note">
  本アプリは個人情報を収集せず、学習データはブラウザ内にのみ保存されます。
</div>
```

#### プライバシーポリシーリンク

```tsx
<a 
  href="/privacy.html" 
  target="_blank" 
  rel="noopener noreferrer"
  className="privacy-link"
>
  📄 プライバシーポリシー
</a>
```

#### データの種類

- **LocalStorage** (約5KB):
  - `batchSize`: 1回の出題数
  - `aiPersonality`: AI人格設定
  - `darkMode`: 表示モード
  - `questionSets`: 問題集リスト
  
- **IndexedDB** (約5MB):
  - `wordProgress`: 単語ごとの学習進捗
  - `sessionHistory`: 学習履歴
  - `retentionData`: 定着率データ

---

### 6. リセット機能

#### データ削除オプション（将来的に追加予定）

```typescript
// 全データリセット
const handleResetAllData = () => {
  if (confirm('すべての学習データを削除しますか？この操作は取り消せません。')) {
    localStorage.clear();
    indexedDB.deleteDatabase('learningApp');
    window.location.reload();
  }
};

// 進捗データのみリセット
const handleResetProgress = () => {
  if (confirm('学習進捗のみをリセットしますか？問題集は保持されます。')) {
    localStorage.removeItem('wordProgress');
    localStorage.removeItem('sessionHistory');
    window.location.reload();
  }
};
```

---

### 7. UI/UX デザイン

#### セクション構成

```tsx
<div className="settings-view">
  <div className="settings-container">
    {/* セクション1: 学習プラン */}
    <div className="section-header">
      <h1>📚 学習プランナー</h1>
    </div>
    <LearningPlanView />

    {/* セクション2: AI人格 */}
    <div className="simple-setting-section">
      <h3>🎭 AIの人格</h3>
      {/* 4つのカード */}
    </div>

    {/* セクション3: 表示モード */}
    <div className="simple-setting-section">
      <h3>🌙 表示モード</h3>
      {/* 3つのボタン */}
    </div>

    {/* セクション4: プライバシー */}
    <div className="simple-setting-section">
      <h3>📋 プライバシー</h3>
      {/* リンクと説明 */}
    </div>
  </div>
</div>
```

#### CSS スタイリング

```css
.personality-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.personality-card {
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.personality-card.active {
  border-color: #2196f3;
  background: #e3f2fd;
}

.personality-avatar {
  font-size: 3em;
  margin-bottom: 8px;
}

.personality-name {
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: 4px;
}

.personality-desc {
  font-size: 0.9em;
  color: #666;
}
```

#### 表示モード切り替えボタン

```css
.theme-toggle-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.theme-btn {
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.theme-btn.active {
  border-color: #2196f3;
  background: #e3f2fd;
}

.theme-icon {
  font-size: 2.5em;
  margin-bottom: 8px;
}

.theme-label {
  font-size: 0.9em;
  font-weight: bold;
}
```

---

### 8. レスポンシブデザイン

#### モバイル対応

```css
@media (max-width: 768px) {
  .personality-grid {
    grid-template-columns: 1fr;
  }
  
  .theme-toggle-grid {
    grid-template-columns: 1fr;
  }
  
  .personality-card,
  .theme-btn {
    padding: 20px;
  }
  
  .personality-avatar,
  .theme-icon {
    font-size: 3.5em;
  }
}
```

#### タブレット対応

```css
@media (min-width: 769px) and (max-width: 1024px) {
  .personality-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .theme-toggle-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

### 9. エラーハンドリング

#### 音声機能非対応ブラウザ

```typescript
if (!isSpeechSynthesisSupported()) {
  console.warn('このブラウザはWeb Speech APIをサポートしていません');
  // UIに警告メッセージを表示
  return;
}
```

#### LocalStorage容量超過

```typescript
try {
  localStorage.setItem('aiPersonality', personality);
} catch (error) {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    alert('ストレージ容量が不足しています。不要なデータを削除してください。');
  }
}
```

#### IndexedDB非対応ブラウザ

```typescript
if (!('indexedDB' in window)) {
  alert('このブラウザはIndexedDBに対応していません。一部の機能が制限されます。');
  // LocalStorageのみで動作するフォールバック
}
```

---

### 10. 将来の拡張計画

#### 追加設定項目

1. **音声設定**:
   - 自動再生ON/OFF
   - 再生速度調整（0.5〜2倍速）
   - 音声の種類選択（男性/女性、米国/英国）

2. **通知設定**:
   - 学習リマインダー（毎日の学習時刻）
   - 忘却アラート（復習が必要な単語の通知）

3. **表示設定**:
   - フォントサイズ調整（小/中/大）
   - アニメーション有効/無効
   - カラースキーム選択（テーマカラー）

4. **データ管理**:
   - エクスポート（CSV/JSON）
   - インポート（バックアップから復元）
   - 選択的削除（特定の問題集のみ削除）

---

## 📚 関連ドキュメント

- [01. プロジェクト概要](./01-project-overview.md) - 全体構成と技術スタック
- [14. AIコメント生成機能](./14-ai-comment-generator.md) - AI人格の詳細仕様
- [16. ストレージ戦略](./16-storage-strategy.md) - データ保存方法
- [18. ダークモード実装](./18-dark-mode.md) - ダークモード詳細仕様
