# 生徒が使える音声機能ガイド

このプロジェクトは、学習中の生徒が**実際に使える音声読み上げ機能**を提供します。

---

## 🎯 推奨方法：ブラウザ標準音声（TTS）⭐⭐⭐⭐⭐

### **特徴**
- ✅ **セットアップ不要**：インストール・設定なし、すぐ使える
- ✅ **すべてのブラウザで動作**：Chrome、Safari、Edge、Firefox等
- ✅ **高品質音声を自動選択**：Google音声（最高品質）を優先
- ✅ **オフラインでも動作**
- ❌ キャラクター音声ではない（システムの標準音声）

### **音声品質**
- **Chrome/Edge**: ⭐⭐⭐⭐⭐ Google高品質音声（最高品質）
- **Safari/macOS**: ⭐⭐⭐⭐ Kyoko/Otoya音声（高品質）
- **Windows**: ⭐⭐⭐ Microsoft標準音声

### **実装方法**
既に `src/features/speech/japaneseSpeech.ts` で実装済みです。

```typescript
import { speakJapanese } from '@/features/speech/japaneseSpeech';

// 正解時
speakJapanese('正解です！');

// 不正解時
speakJapanese('惜しい！もう一回！');

// 速度調整
speakJapanese('よくできました！', { rate: 1.2 });
```

---

## 🎨 より高品質な音声：外部API統合 ⭐⭐⭐⭐⭐

さらに高品質な音声が必要な場合、外部APIを使用できます。

### **Google Cloud TTS** 💰 低コスト、高品質
- **無料枠**: 月100万文字
- **料金**: $4/100万文字（超過分）
- **品質**: ⭐⭐⭐⭐⭐ Neural2モデル（最高品質）
- **セットアップ**: APIキーのみ

### **ElevenLabs** 🎭 超高品質、感情表現
- **無料枠**: 月10,000文字
- **料金**: $5/月〜
- **品質**: ⭐⭐⭐⭐⭐ 人間に最も近い
- **セットアップ**: APIキーのみ

### **OpenAI TTS** 🤖 高品質
- **無料枠**: なし
- **料金**: $15/100万文字
- **品質**: ⭐⭐⭐⭐
- **セットアップ**: APIキーのみ

### **使い方**
`src/features/speech/premiumVoiceServices.ts` を使用：

```typescript
import { synthesizeAndPlay, configureVoiceService } from '@/features/speech/premiumVoiceServices';

// Google Cloud TTSを設定
configureVoiceService({
  service: 'google-cloud',
  apiKey: 'YOUR_API_KEY',
});

// 使用
await synthesizeAndPlay('正解です！');
```

---

## 📊 方法の比較

| 方法 | セットアップ | 品質 | コスト | 推奨度 |
|------|------------|------|--------|--------|
| **ブラウザTTS** | ✅ 不要 | ⭐⭐⭐⭐ | 無料 | ⭐⭐⭐⭐⭐ |
| **Google Cloud TTS** | APIキー | ⭐⭐⭐⭐⭐ | 月100万文字無料 | ⭐⭐⭐⭐ |
| **ElevenLabs** | APIキー | ⭐⭐⭐⭐⭐ | 月10,000文字無料 | ⭐⭐⭐⭐ |
| **OpenAI TTS** | APIキー | ⭐⭐⭐⭐ | $15/100万文字 | ⭐⭐⭐ |

---

## 🛠️ 実装手順

### Step 1: 音声設定UIの追加

社会科クイズに音声機能を統合します。

```typescript
// src/features/social-studies/components/SocialStudiesView.tsx

import { speakJapanese } from '@/features/speech/japaneseSpeech';
import { VoiceSettingsPanel } from '@/components/VoiceSettingsPanel';

// 正解時のフィードバック
function handleCorrectAnswer() {
  speakJapanese('正解です！');
  // ... 既存のロジック
}

// 不正解時のフィードバック
function handleIncorrectAnswer() {
  speakJapanese('惜しい！もう一回！');
  // ... 既存のロジック
}

// 設定タブに音声設定を追加
<TabPanel value="settings">
  <VoiceSettingsPanel />
</TabPanel>
```

### Step 2: 設定画面での音声選択

`VoiceSettingsPanel.tsx` で以下の設定が可能：
- **音声サービス**: ブラウザ / Google Cloud / ElevenLabs / OpenAI
- **声の種類**: 利用可能な音声から選択（ブラウザTTSの場合）
- **読み上げ速度**: 0.5x 〜 2.0x
- **APIキー**: 外部サービス使用時

---

## 💡 使用シーン別の推奨

### **個人学習・家庭用**
→ **ブラウザTTS**（無料、セットアップ不要）

### **学校・塾での利用**
→ **Google Cloud TTS**（月100万文字無料、高品質）

### **商用プロダクト**
→ **ElevenLabs**（最高品質、感情表現可能）

---

## 🔍 音声品質の確認方法

1. アプリを起動
2. 設定タブを開く
3. **🔊 音声をテスト**ボタンをクリック
4. 「これはテスト音声です。正解です！」が再生される
5. 異なる音声を選択して比較

---

## ⚙️ トラブルシューティング

### 音声が再生されない
- ブラウザの音量がミュートになっていないか確認
- 他のタブで音声が再生されていないか確認（Chrome制限）
- Safariの場合、ユーザーアクションが必要（ボタンクリック）

### 選択した音声が使われない
- 設定を保存後、ページをリロード
- ブラウザの開発者ツールでログを確認

### 外部API音声が使えない
- APIキーが正しく設定されているか確認
- 無料枠を超過していないか確認
- ネットワーク接続を確認

---

## 📚 関連ドキュメント

- [premiumVoiceServices.ts](../../src/features/speech/premiumVoiceServices.ts)：外部API統合
- [japaneseSpeech.ts](../../src/features/speech/japaneseSpeech.ts)：ブラウザTTS実装
- [VoiceSettingsPanel.tsx](../../src/components/VoiceSettingsPanel.tsx)：音声設定UI

---

**結論**: まずはブラウザ標準音声から始めるのが最適です。セットアップ不要で、Google音声が使えれば十分な品質です。より高品質が必要な場合のみ、外部APIを検討してください。
