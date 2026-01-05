/**
 * 生徒が実際に使える日本語音声読み上げ機能
 *
 * Web Speech API（ブラウザ標準）を使用
 * - セットアップ不要
 * - すべてのブラウザで動作（Chrome, Safari, Firefox等）
 * - オフラインでも動作
 */

import { logger } from '@/utils/logger';

/**
 * 日本語音声合成がサポートされているか確認
 */
export function isJapaneseTTSSupported(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * 利用可能な日本語音声を取得
 */
export function getJapaneseVoices(): SpeechSynthesisVoice[] {
  if (!isJapaneseTTSSupported()) {
    return [];
  }

  const voices = window.speechSynthesis.getVoices();
  return voices.filter((voice) => voice.lang.startsWith('ja'));
}

/**
 * 高品質な日本語音声を優先順に取得
 * Google音声 > ニューラル音声 > 標準音声
 */
function selectBestJapaneseVoice(preferredGender: 'male' | 'female' = 'female'): SpeechSynthesisVoice | null {
  const voices = getJapaneseVoices();
  if (voices.length === 0) return null;

  // 高品質音声の優先順位（実測に基づく品質順）
  const highQualityPriority = [
    // Google音声（最高品質、Chrome/Edgeで利用可能）
    'Google 日本語',
    'ja-JP-Neural2-', // Google Cloud TTS Neural2
    'ja-JP-Wavenet-', // Google Cloud TTS Wavenet

    // macOS音声（高品質）
    'Kyoko',  // 女性、標準
    'Otoya',  // 男性

    // Windows音声（Microsoft Azure Neural）
    'Microsoft Nanami Online',  // 女性、高品質
    'Microsoft Keita Online',   // 男性、高品質
    'Microsoft Ayumi',  // 女性、標準
    'Microsoft Ichiro', // 男性、標準

    // iOS音声
    'Kyoko',  // 女性（macOSと同じ）
    'Otoya',  // 男性
  ];

  // 性別でフィルタ
  let filteredVoices = voices;
  if (preferredGender === 'female') {
    // 女性音声を優先
    filteredVoices = voices.filter(v => {
      const name = v.name.toLowerCase();
      return !name.includes('male') &&
             !name.includes('otoya') &&
             !name.includes('ichiro') &&
             !name.includes('keita');
    });
    // 女性音声がない場合は全音声から選択
    if (filteredVoices.length === 0) filteredVoices = voices;
  } else {
    // 男性音声を優先
    filteredVoices = voices.filter(v => {
      const name = v.name.toLowerCase();
      return name.includes('male') ||
             name.includes('otoya') ||
             name.includes('ichiro') ||
             name.includes('keita');
    });
    // 男性音声がない場合は全音声から選択
    if (filteredVoices.length === 0) filteredVoices = voices;
  }

  // 優先順位に基づいて最適な音声を選択
  for (const priority of highQualityPriority) {
    const found = filteredVoices.find(v => v.name.includes(priority));
    if (found) {
      logger.info(`選択された音声: ${found.name} (${found.lang})`);
      return found;
    }
  }

  // Google音声を最優先で探す（品質が圧倒的に良い）
  const googleVoice = filteredVoices.find(v => v.name.includes('Google'));
  if (googleVoice) {
    logger.info(`選択された音声: ${googleVoice.name} (Google品質)`);
    return googleVoice;
  }

  // ニューラル/Wavenet音声を探す
  const neuralVoice = filteredVoices.find(v =>
    v.name.includes('Neural') ||
    v.name.includes('Wavenet') ||
    v.name.includes('Online')
  );
  if (neuralVoice) {
    logger.info(`選択された音声: ${neuralVoice.name} (ニューラル品質)`);
    return neuralVoice;
  }

  // 標準音声の中からベストを選択
  const bestVoice = filteredVoices[0];
  logger.info(`選択された音声: ${bestVoice.name} (標準品質)`);
  return bestVoice;
}

/**
 * 日本語を読み上げる（ブラウザ標準機能）
 *
 * @param text 読み上げるテキスト
 * @param options オプション設定
 * @example
 * // 基本的な使い方
 * speakJapanese('正解です！');
 *
 * // 速度を調整
 * speakJapanese('惜しい！もう一回！', { rate: 1.2 });
 *
 * // 女性の声を指定
 * speakJapanese('よくできました！', { gender: 'female' });
 */
export function speakJapanese(
  text: string,
  options: {
    rate?: number; // 速度 (0.1 - 10, デフォルト: 1.0)
    pitch?: number; // ピッチ (0 - 2, デフォルト: 1.0)
    volume?: number; // 音量 (0 - 1, デフォルト: 1.0)
    gender?: 'male' | 'female'; // 音声の性別（可能な場合）
  } = {}
): void {
  if (!isJapaneseTTSSupported()) {
    logger.warn('このブラウザは音声合成をサポートしていません');
    return;
  }

  // 既存の発話を停止
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);

  // localStorageから設定を読み込み
  const savedRate = localStorage.getItem('japaneseSpeechRate');
  const savedGender = localStorage.getItem('japaneseVoiceGender');

  // 基本設定
  utterance.lang = 'ja-JP';
  utterance.rate = options.rate || (savedRate ? parseFloat(savedRate) : 1.0);
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;

  // 音声の選択
  const voices = getJapaneseVoices();
  if (voices.length > 0) {
    const savedVoiceName = localStorage.getItem('selectedVoiceName');

    // 保存された音声名があれば、それを優先使用
    if (savedVoiceName) {
      const savedVoice = voices.find(v => v.name === savedVoiceName);
      if (savedVoice) {
        utterance.voice = savedVoice;
        logger.info(`選択された音声: ${savedVoice.name} (ユーザー設定)`);
      } else {
        // 保存された音声が見つからない場合は自動選択
        const preferredGender = options.gender || savedGender || 'female';
        const selectedVoice = selectBestJapaneseVoice(preferredGender as 'male' | 'female');
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
    } else {
      // 保存された音声がない場合は自動選択
      const preferredGender = options.gender || savedGender || 'female';
      const selectedVoice = selectBestJapaneseVoice(preferredGender as 'male' | 'female');
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }
  }

  // エラーハンドリング
  utterance.onerror = (event) => {
    logger.error('音声合成エラー:', event);
  };

  // 音声を再生
  window.speechSynthesis.speak(utterance);
}

/**
 * 音声再生を停止
 */
export function stopJapaneseSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * 音声設定を取得
 */
export function getJapaneseSpeechSettings(): {
  rate: number;
  gender: 'male' | 'female';
  selectedVoiceName: string | null;
} {
  return {
    rate: parseFloat(localStorage.getItem('japaneseSpeechRate') || '1.0'),
    gender: (localStorage.getItem('japaneseVoiceGender') as 'male' | 'female') || 'female',
    selectedVoiceName: localStorage.getItem('selectedVoiceName'),
  };
}

/**
 * 音声設定を保存
 */
export function saveJapaneseSpeechSettings(settings: {
  rate?: number;
  gender?: 'male' | 'female';
  selectedVoiceName?: string;
}): void {
  if (settings.rate !== undefined) {
    localStorage.setItem('japaneseSpeechRate', settings.rate.toString());
  }
  if (settings.gender !== undefined) {
    localStorage.setItem('japaneseVoiceGender', settings.gender);
  }
  if (settings.selectedVoiceName !== undefined) {
    localStorage.setItem('selectedVoiceName', settings.selectedVoiceName);
  }
}

/**
 * 社会科クイズ用のフィードバックメッセージ
 */
export const FEEDBACK_MESSAGES = {
  correct: [
    '正解です！',
    'すごい！',
    'よくできました！',
    'その調子！',
    '素晴らしい！',
  ],
  incorrect: [
    '惜しい！もう一回！',
    '頑張って！',
    '次は正解できるよ！',
    'もう一度考えてみよう！',
  ],
  complete: {
    excellent: (score: number, total: number) =>
      `素晴らしい！${total}問中${score}問正解です！完璧です！`,
    good: (score: number, total: number) =>
      `よくできました！${total}問中${score}問正解です！`,
    average: (score: number, total: number) =>
      `お疲れ様でした！${total}問中${score}問正解です。次は頑張りましょう！`,
  },
} as const;

/**
 * 正解時のフィードバック
 */
export function playCorrectFeedback(): void {
  const messages = FEEDBACK_MESSAGES.correct;
  const message = messages[Math.floor(Math.random() * messages.length)];
  speakJapanese(message, { rate: 1.1 }); // 少し速めで元気よく
}

/**
 * 不正解時のフィードバック
 */
export function playIncorrectFeedback(): void {
  const messages = FEEDBACK_MESSAGES.incorrect;
  const message = messages[Math.floor(Math.random() * messages.length)];
  speakJapanese(message, { rate: 1.0 });
}

/**
 * セッション完了時のフィードバック
 */
export function playCompleteFeedback(score: number, total: number): void {
  const percentage = Math.round((score / total) * 100);

  let message: string;
  if (percentage >= 90) {
    message = FEEDBACK_MESSAGES.complete.excellent(score, total);
  } else if (percentage >= 70) {
    message = FEEDBACK_MESSAGES.complete.good(score, total);
  } else {
    message = FEEDBACK_MESSAGES.complete.average(score, total);
  }

  speakJapanese(message, { rate: 1.0 });
}

/**
 * 語句の意味を読み上げ
 */
export function readMeaning(term: string, meaning: string): void {
  const message = `${term}の意味は、${meaning}です。`;
  speakJapanese(message, { rate: 0.9 }); // ゆっくり読む
}

/**
 * 詳細解説を読み上げ
 */
export function readExplanation(explanation: string): void {
  // 長すぎる場合は最初の100文字のみ
  const shortExplanation = explanation.length > 100
    ? explanation.substring(0, 100) + '。'
    : explanation;

  speakJapanese(shortExplanation, { rate: 0.9 });
}
