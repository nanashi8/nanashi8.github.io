/**
 * 高品質音声サービス統合
 *
 * ブラウザ標準音声より高品質な音声を提供する外部APIとの統合
 * 無料枠・低コストで使えるサービスを優先
 */

import { logger } from '@/utils/logger';

/**
 * 音声サービスの種類
 */
export type VoiceService =
  | 'browser'           // ブラウザ標準（無料）
  | 'google-cloud'      // Google Cloud TTS（$4/100万文字）
  | 'elevenlabs'        // ElevenLabs（月10,000文字無料）
  | 'openai';           // OpenAI TTS（$15/100万文字）

/**
 * 音声設定
 */
interface VoiceConfig {
  service: VoiceService;
  apiKey?: string;
  endpoint?: string;
  voiceId?: string;
}

// デフォルト設定
let currentConfig: VoiceConfig = {
  service: 'browser',
};

/**
 * 音声サービスを設定
 */
export function configureVoiceService(config: Partial<VoiceConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  localStorage.setItem('voiceServiceConfig', JSON.stringify(currentConfig));
  logger.info('音声サービス設定を更新:', currentConfig.service);
}

/**
 * 保存された設定を読み込み
 */
export function loadVoiceServiceConfig(): VoiceConfig {
  const saved = localStorage.getItem('voiceServiceConfig');
  if (saved) {
    try {
      currentConfig = JSON.parse(saved);
    } catch (error) {
      logger.error('音声設定の読み込みエラー:', error);
    }
  }
  return currentConfig;
}

/**
 * Google Cloud Text-to-Speech で音声合成
 *
 * 無料枠: 月100万文字まで無料（WaveNetは無料枠なし）
 * 料金: $4/100万文字（標準）、$16/100万文字（WaveNet/Neural2）
 * 品質: ⭐⭐⭐⭐⭐ 最高品質
 *
 * セットアップ:
 * 1. https://console.cloud.google.com/ でAPIキーを取得
 * 2. Text-to-Speech API を有効化
 * 3. configureVoiceService({ service: 'google-cloud', apiKey: 'YOUR_KEY' })
 */
async function synthesizeWithGoogleCloud(text: string): Promise<Blob> {
  const apiKey = currentConfig.apiKey;
  if (!apiKey) {
    throw new Error('Google Cloud API キーが設定されていません');
  }

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'ja-JP',
          name: currentConfig.voiceId || 'ja-JP-Neural2-B', // 女性、高品質
          // その他の選択肢:
          // 'ja-JP-Neural2-C' - 男性、高品質
          // 'ja-JP-Wavenet-A' - 女性、自然
          // 'ja-JP-Standard-A' - 女性、標準（無料枠対象）
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
          volumeGainDb: 0.0,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google Cloud TTS エラー: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  const audioContent = data.audioContent;

  // Base64デコード
  const binaryString = atob(audioContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: 'audio/mp3' });
}

/**
 * ElevenLabs で音声合成
 *
 * 無料枠: 月10,000文字まで無料
 * 料金: $5/月（月30,000文字）、$22/月（月100,000文字）
 * 品質: ⭐⭐⭐⭐⭐ 超高品質（最も自然）
 *
 * セットアップ:
 * 1. https://elevenlabs.io/ でアカウント作成
 * 2. APIキーを取得
 * 3. configureVoiceService({ service: 'elevenlabs', apiKey: 'YOUR_KEY' })
 */
async function synthesizeWithElevenLabs(text: string): Promise<Blob> {
  const apiKey = currentConfig.apiKey;
  if (!apiKey) {
    throw new Error('ElevenLabs API キーが設定されていません');
  }

  // 日本語対応の音声ID（多言語モデル）
  const voiceId = currentConfig.voiceId || 'pNInz6obpgDQGcFmaJgB'; // Adam（多言語対応）

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // 日本語対応モデル
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS エラー: ${error}`);
  }

  return await response.blob();
}

/**
 * OpenAI Text-to-Speech で音声合成
 *
 * 料金: $15/100万文字
 * 品質: ⭐⭐⭐⭐ 高品質
 *
 * セットアップ:
 * 1. https://platform.openai.com/ でAPIキーを取得
 * 2. configureVoiceService({ service: 'openai', apiKey: 'YOUR_KEY' })
 */
async function synthesizeWithOpenAI(text: string): Promise<Blob> {
  const apiKey = currentConfig.apiKey;
  if (!apiKey) {
    throw new Error('OpenAI API キーが設定されていません');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1-hd', // 高品質モデル（tts-1は標準品質）
      input: text,
      voice: currentConfig.voiceId || 'alloy', // alloy, echo, fable, onyx, nova, shimmer
      // 注: OpenAI TTSは日本語対応だが、音声の自然さはGoogle/ElevenLabsに劣る
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI TTS エラー: ${JSON.stringify(error)}`);
  }

  return await response.blob();
}

/**
 * 統合音声合成関数
 * 設定されたサービスで音声を合成して再生
 */
export async function synthesizeAndPlay(text: string): Promise<void> {
  try {
    let audioBlob: Blob;

    switch (currentConfig.service) {
      case 'google-cloud':
        audioBlob = await synthesizeWithGoogleCloud(text);
        break;

      case 'elevenlabs':
        audioBlob = await synthesizeWithElevenLabs(text);
        break;

      case 'openai':
        audioBlob = await synthesizeWithOpenAI(text);
        break;

      case 'browser':
      default:
        // ブラウザ標準音声にフォールバック
        const { speakJapanese } = await import('./japaneseSpeech');
        speakJapanese(text);
        return;
    }

    // 音声を再生
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };
      audio.play().catch(reject);
    });
  } catch (error) {
    logger.error('音声合成エラー、ブラウザ標準音声にフォールバック:', error);
    // エラー時はブラウザ標準音声で再生
    const { speakJapanese } = await import('./japaneseSpeech');
    speakJapanese(text);
  }
}

/**
 * 利用可能なサービスと説明
 */
export const VOICE_SERVICES = [
  {
    id: 'browser' as VoiceService,
    name: 'ブラウザ標準音声',
    quality: 3,
    cost: '無料',
    setup: '不要',
    description: 'Chrome/Safari等の標準音声。Google音声が使える場合は高品質。',
    setupUrl: undefined,
  },
  {
    id: 'google-cloud' as VoiceService,
    name: 'Google Cloud TTS',
    quality: 5,
    cost: '月100万文字無料、超過分$4/100万文字',
    setup: 'APIキー必要',
    description: '最高品質の自然な音声。Neural2モデル推奨。',
    setupUrl: 'https://console.cloud.google.com/',
  },
  {
    id: 'elevenlabs' as VoiceService,
    name: 'ElevenLabs',
    quality: 5,
    cost: '月10,000文字無料、$5/月〜',
    setup: 'APIキー必要',
    description: '超高品質で最も自然な音声。感情表現も可能。',
    setupUrl: 'https://elevenlabs.io/',
  },
  {
    id: 'openai' as VoiceService,
    name: 'OpenAI TTS',
    quality: 4,
    cost: '$15/100万文字',
    setup: 'APIキー必要',
    description: '高品質音声。日本語対応だがGoogle/ElevenLabsより劣る。',
    setupUrl: 'https://platform.openai.com/api-keys',
  },
] as const;
