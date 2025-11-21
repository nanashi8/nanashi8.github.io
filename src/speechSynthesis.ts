/**
 * Web Speech API を使用した音声合成ユーティリティ
 */

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
    console.warn('このブラウザはWeb Speech APIをサポートしていません');
    return;
  }

  // 既存の発話を停止
  window.speechSynthesis.cancel();

  // 発話オブジェクトを作成
  const utterance = new SpeechSynthesisUtterance(text);
  
  // オプションを設定
  utterance.lang = options.lang || 'en-US';
  utterance.rate = options.rate || 0.9; // 少しゆっくりめ
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;

  // エラーハンドリング
  utterance.onerror = (event) => {
    console.error('音声合成エラー:', event);
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
