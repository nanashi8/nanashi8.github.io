# 設定画面仕様書

## 📌 概要

ユーザーがアプリケーションの動作をカスタマイズできる設定画面。

**作成日**: 2025年11月19日  
**最終更新**: 2025年11月19日

## 🎯 機能要件

### 設定項目

1. **表示設定**
   - ダークモード切り替え
   - フォントサイズ調整

2. **学習設定**
   - AI人格タイプ選択
   - 適応的学習モードON/OFF
   - 自動進行設定
   - 自動進行の遅延時間

3. **データ管理**
   - 進捗データのエクスポート
   - 進捗データのインポート
   - 進捗データのクリア

4. **アプリ情報**
   - バージョン情報
   - LocalStorage使用量

## 📊 データ構造

### 設定型

```typescript
interface AppSettings {
  // 表示設定
  darkMode: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  
  // 学習設定
  aiPersonality: AIPersonality;
  adaptiveMode: boolean;
  autoAdvance: boolean;
  autoAdvanceDelay: number; // 秒
  
  // その他
  showDetailedExplanations: boolean;
}
```

## 🔧 実装詳細

### SettingsView.tsx

```typescript
import { useState, useEffect } from 'react';
import { AIPersonality } from '../types';
import { exportProgress, importProgress, clearProgress } from '../progressStorage';

interface SettingsViewProps {
  darkMode: 'light' | 'dark' | 'system';
  onDarkModeChange: (mode: 'light' | 'dark' | 'system') => void;
  aiPersonality: AIPersonality;
  onAIPersonalityChange: (personality: AIPersonality) => void;
  adaptiveMode: boolean;
  onAdaptiveModeChange: (enabled: boolean) => void;
  autoAdvance: boolean;
  onAutoAdvanceChange: (enabled: boolean) => void;
  autoAdvanceDelay: number;
  onAutoAdvanceDelayChange: (delay: number) => void;
}

export default function SettingsView({
  darkMode,
  onDarkModeChange,
  aiPersonality,
  onAIPersonalityChange,
  adaptiveMode,
  onAdaptiveModeChange,
  autoAdvance,
  onAutoAdvanceChange,
  autoAdvanceDelay,
  onAutoAdvanceDelayChange,
}: SettingsViewProps) {
  const [storageSize, setStorageSize] = useState<string>('計算中...');
  
  useEffect(() => {
    calculateStorageSize();
  }, []);
  
  const calculateStorageSize = () => {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
    }
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    setStorageSize(`${sizeMB} MB`);
  };
  
  const handleExport = () => {
    const data = exportProgress();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        if (importProgress(data)) {
          alert('進捗データをインポートしました');
          calculateStorageSize();
        } else {
          alert('インポートに失敗しました');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  
  const handleClear = () => {
    if (confirm('本当に進捗データをクリアしますか？この操作は取り消せません。')) {
      clearProgress();
      alert('進捗データをクリアしました');
      calculateStorageSize();
    }
  };
  
  return (
    <div className="settings-view">
      <h2>⚙️ 設定</h2>
      
      {/* 表示設定 */}
      <section className="settings-section">
        <h3>🎨 表示設定</h3>
        
        <div className="setting-item">
          <label>ダークモード</label>
          <select
            value={darkMode}
            onChange={(e) => onDarkModeChange(e.target.value as 'light' | 'dark' | 'system')}
          >
            <option value="light">☀️ ライトモード</option>
            <option value="dark">🌙 ダークモード</option>
            <option value="system">💻 システム設定に従う</option>
          </select>
        </div>
      </section>
      
      {/* 学習設定 */}
      <section className="settings-section">
        <h3>📚 学習設定</h3>
        
        <div className="setting-item">
          <label>AI人格タイプ</label>
          <select
            value={aiPersonality}
            onChange={(e) => onAIPersonalityChange(e.target.value as AIPersonality)}
          >
            <option value="drill-sergeant">🎖️ 鬼軍曹（厳しい指導）</option>
            <option value="kind-teacher">👩‍🏫 優しい先生（励まし）</option>
            <option value="analyst">📊 冷静な分析官（データ重視）</option>
            <option value="enthusiastic-coach">🔥 熱血コーチ（熱意）</option>
            <option value="wise-sage">🧙 賢者（哲学的）</option>
          </select>
          <p className="setting-description">
            AIアシスタントの性格を選択します。学習時のコメントやアドバイスのトーンが変わります。
          </p>
        </div>
        
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={adaptiveMode}
              onChange={(e) => onAdaptiveModeChange(e.target.checked)}
            />
            適応的学習モード
          </label>
          <p className="setting-description">
            あなたの弱点を分析し、苦手な単語やカテゴリーを優先的に出題します。
          </p>
        </div>
        
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => onAutoAdvanceChange(e.target.checked)}
            />
            自動進行
          </label>
          <p className="setting-description">
            回答後、自動的に次の問題に進みます。
          </p>
        </div>
        
        {autoAdvance && (
          <div className="setting-item indent">
            <label>自動進行の遅延時間: {autoAdvanceDelay}秒</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={autoAdvanceDelay}
              onChange={(e) => onAutoAdvanceDelayChange(Number(e.target.value))}
            />
          </div>
        )}
      </section>
      
      {/* データ管理 */}
      <section className="settings-section">
        <h3>💾 データ管理</h3>
        
        <div className="setting-item">
          <label>LocalStorage使用量</label>
          <div className="storage-info">
            <span>{storageSize}</span>
            <span className="storage-limit"> / 5.00 MB</span>
          </div>
          <p className="setting-description">
            30日以上前のデータは自動的に削除されます。
          </p>
        </div>
        
        <div className="setting-item">
          <button className="export-btn" onClick={handleExport}>
            📤 進捗データをエクスポート
          </button>
          <p className="setting-description">
            学習進捗をJSONファイルとして保存します。
          </p>
        </div>
        
        <div className="setting-item">
          <button className="import-btn" onClick={handleImport}>
            📥 進捗データをインポート
          </button>
          <p className="setting-description">
            以前エクスポートした進捗データを読み込みます。
          </p>
        </div>
        
        <div className="setting-item">
          <button className="clear-btn danger" onClick={handleClear}>
            🗑️ 進捗データをクリア
          </button>
          <p className="setting-description warning">
            ⚠️ すべての学習履歴が削除されます。この操作は取り消せません。
          </p>
        </div>
      </section>
      
      {/* アプリ情報 */}
      <section className="settings-section">
        <h3>ℹ️ アプリ情報</h3>
        
        <div className="app-info">
          <div className="info-row">
            <span className="info-label">アプリ名:</span>
            <span>英単語3択クイズ</span>
          </div>
          <div className="info-row">
            <span className="info-label">バージョン:</span>
            <span>2.0.0</span>
          </div>
          <div className="info-row">
            <span className="info-label">最終更新:</span>
            <span>2025年11月19日</span>
          </div>
        </div>
      </section>
    </div>
  );
}
```

## 🎨 スタイリング

### CSS（App.css内）

```css
/* 設定画面 */
.settings-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-section {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--primary-color);
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.setting-item select,
.setting-item input[type="range"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 1rem;
}

.setting-item input[type="checkbox"] {
  margin-right: 0.5rem;
}

.setting-description {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.setting-description.warning {
  color: var(--danger-color);
  font-weight: 600;
}

.indent {
  margin-left: 2rem;
}

/* データ管理ボタン */
.export-btn,
.import-btn,
.clear-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.export-btn {
  background: var(--success-color);
  color: white;
}

.export-btn:hover {
  background: var(--success-hover);
}

.import-btn {
  background: var(--primary-color);
  color: white;
}

.import-btn:hover {
  background: var(--primary-hover);
}

.clear-btn.danger {
  background: var(--danger-color);
  color: white;
}

.clear-btn.danger:hover {
  background: var(--danger-hover);
}

/* ストレージ情報 */
.storage-info {
  font-size: 1.2rem;
  font-weight: 600;
}

.storage-limit {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* アプリ情報 */
.app-info {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: var(--text-secondary);
}

/* ダークモード */
.dark-mode .settings-section {
  background: var(--dark-card-bg);
}

.dark-mode .setting-item select,
.dark-mode .setting-item input[type="range"] {
  background: var(--dark-input-bg);
  color: var(--dark-text);
  border-color: var(--dark-border);
}

.dark-mode .app-info {
  background: var(--dark-bg-secondary);
}
```

## 🔄 App.tsx統合

```typescript
// App.tsx内
const [activeTab, setActiveTab] = useState<Tab>('translation');
const [darkMode, setDarkMode] = useState<'light' | 'dark' | 'system'>('system');
const [aiPersonality, setAIPersonality] = useState<AIPersonality>('kind-teacher');
const [adaptiveMode, setAdaptiveMode] = useState<boolean>(false);
const [autoAdvance, setAutoAdvance] = useState<boolean>(false);
const [autoAdvanceDelay, setAutoAdvanceDelay] = useState<number>(1.5);

// LocalStorageから読み込み
useEffect(() => {
  const savedDarkMode = localStorage.getItem('darkMode') as 'light' | 'dark' | 'system' | null;
  if (savedDarkMode) setDarkMode(savedDarkMode);
  
  const savedPersonality = localStorage.getItem('aiPersonality') as AIPersonality | null;
  if (savedPersonality) setAIPersonality(savedPersonality);
  
  const savedAdaptive = localStorage.getItem('adaptiveMode');
  if (savedAdaptive) setAdaptiveMode(JSON.parse(savedAdaptive));
  
  const savedAutoAdvance = localStorage.getItem('autoAdvance');
  if (savedAutoAdvance) setAutoAdvance(JSON.parse(savedAutoAdvance));
  
  const savedDelay = localStorage.getItem('autoAdvanceDelay');
  if (savedDelay) setAutoAdvanceDelay(JSON.parse(savedDelay));
}, []);

// LocalStorageに保存
useEffect(() => {
  localStorage.setItem('darkMode', darkMode);
}, [darkMode]);

useEffect(() => {
  localStorage.setItem('aiPersonality', aiPersonality);
}, [aiPersonality]);

// ... 他の設定も同様

// タブメニュー
<button
  className={activeTab === 'settings' ? 'active' : ''}
  onClick={() => setActiveTab('settings')}
>
  ⚙️ 設定
</button>

// コンテンツ
{activeTab === 'settings' && (
  <SettingsView
    darkMode={darkMode}
    onDarkModeChange={setDarkMode}
    aiPersonality={aiPersonality}
    onAIPersonalityChange={setAIPersonality}
    adaptiveMode={adaptiveMode}
    onAdaptiveModeChange={setAdaptiveMode}
    autoAdvance={autoAdvance}
    onAutoAdvanceChange={setAutoAdvance}
    autoAdvanceDelay={autoAdvanceDelay}
    onAutoAdvanceDelayChange={setAutoAdvanceDelay}
  />
)}
```

## 🔄 機能復元手順

1. `src/components/SettingsView.tsx` を作成
2. 上記のコンポーネントコードを実装
3. `App.css` にスタイルを追加
4. `App.tsx` に統合
5. LocalStorage連携を確認

## 📝 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2025-11-19 | 初版作成 |
