/**
 * Web Speech API を使用した音声合成ユーティリティ
 */

import { logger } from '@/logger';

/**
 * 会話形式のテキストから話者名と記号を除去
 * 例: 'Tom: "Hello, how are you?"' → 'Hello, how are you?'
 * @param text 元のテキスト
 * @returns クリーンアップされたテキスト
 */
export function cleanDialogueText(text: string): string {
  // 会話形式のパターンをチェック: "話者名: "..." の形式
  // パターン1: Speaker: "text" → text
  // パターン2: Speaker: text → text
  
  // ": "..." 形式の場合
  const quotedPattern = /^[^:]+:\s*[""](.+?)[""]$/;
  const quotedMatch = text.match(quotedPattern);
  if (quotedMatch) {
    return quotedMatch[1].trim();
  }
  
  // ": text 形式の場合（引用符なし）
  const unquotedPattern = /^[^:]+:\s*(.+)$/;
  const unquotedMatch = text.match(unquotedPattern);
  if (unquotedMatch) {
    return unquotedMatch[1].trim();
  }
  
  // パターンに一致しない場合はそのまま返す
  return text;
}

/**
 * 英単語を発音する
 * @param text 発音する英語テキスト
 * @param options オプション設定
 */
export function speakEnglish(
  text: string,
  options: {
    rate?: number;      // 速度 (0.1 - 10, デフォルト: 1)
    pitch?: number;     // ピッチ (0 - 2, デフォルト: 1)
    volume?: number;    // 音量 (0 - 1, デフォルト: 1)
    lang?: string;      // 言語 (デフォルト: 'en-US')
  } = {}
): void {
  // Web Speech API のサポート確認
  if (!('speechSynthesis' in window)) {
    logger.warn('このブラウザはWeb Speech APIをサポートしていません');
    return;
  }

  // 会話形式のテキストから話者名と記号を除去
  const cleanedText = cleanDialogueText(text);

  // 既存の発話を停止
  window.speechSynthesis.cancel();

  // 発話オブジェクトを作成
  const utterance = new SpeechSynthesisUtterance(cleanedText);
  
  // localStorageから設定を読み込み
  const savedRate = localStorage.getItem('speechRate');
  const savedGender = localStorage.getItem('voiceGender');
  
  // オプションを設定
  utterance.lang = options.lang || 'en-US';
  utterance.rate = options.rate || (savedRate ? parseFloat(savedRate) : 0.85);
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;

  // 声の種類を設定
  if (savedGender) {
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
    
    if (savedGender === 'female') {
      const femaleVoice = englishVoices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('woman') ||
        v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('samantha')
      );
      if (femaleVoice) utterance.voice = femaleVoice;
    } else if (savedGender === 'male') {
      const maleVoice = englishVoices.find(v => 
        v.name.toLowerCase().includes('male') || 
        v.name.toLowerCase().includes('man') ||
        v.name.toLowerCase().includes('david') ||
        v.name.toLowerCase().includes('alex')
      );
      if (maleVoice) utterance.voice = maleVoice;
    }
  }

  // エラーハンドリング
  utterance.onerror = (event) => {
    logger.error('音声合成エラー:', event);
  };

  // 発音を実行
  window.speechSynthesis.speak(utterance);
}

/**
 * 音声合成をサポートしているか確認
 */
export function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * 現在の発音を停止
 */
export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * 現在の発音を一時停止
 */
export function pauseSpeaking(): void {
  if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
}

/**
 * 一時停止した発音を再開
 */
export function resumeSpeaking(): void {
  if ('speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

/**
 * 発音中かどうか確認
 */
export function isSpeaking(): boolean {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking;
}

/**
 * 一時停止中かどうか確認
 */
export function isPaused(): boolean {
  return 'speechSynthesis' in window && window.speechSynthesis.paused;
}

/**
 * 利用可能な音声リストを取得（英語音声のみ）
 */
export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) {
    return [];
  }

  const voices = window.speechSynthesis.getVoices();
  return voices.filter(voice => voice.lang.startsWith('en-'));
}

/**
 * 単語をクリック時に発音（ビジュアルフィードバック付き）
 * @param text 発音するテキスト
 * @param element クリックされた要素（アニメーション用）
 */
export function speakWordWithFeedback(
  text: string,
  element?: HTMLElement
): void {
  // 発音
  speakEnglish(text);

  // ビジュアルフィードバック
  if (element) {
    element.classList.add('speaking');
    
    // アニメーション終了後にクラスを削除
    setTimeout(() => {
      element.classList.remove('speaking');
    }, 600);
  }
}
