/**
 * ResourceManager - 音声・画像リソース管理
 *
 * **機能**:
 * - 音声ファイルキャッシング
 * - TTS API統合
 * - 画像URL管理
 * - リソース遅延読み込み
 *
 * Phase 6: 多様な復習方法統合
 */

import type { Word } from './ContextRotationSystem';

/**
 * 音声リソース情報
 */
interface AudioResource {
  /** 単語 */
  word: string;
  /** 音声URL */
  url: string;
  /** キャッシュ済みフラグ */
  cached: boolean;
  /** 音声データ */
  audio?: HTMLAudioElement;
}

/**
 * 画像リソース情報
 */
interface ImageResource {
  /** 単語 */
  word: string;
  /** 画像URL */
  url: string;
  /** キャッシュ済みフラグ */
  cached: boolean;
}

/**
 * TTS設定
 */
interface TTSConfig {
  /** 言語 */
  lang: 'en-US' | 'en-GB';
  /** 音声の高さ（0.5-2.0） */
  pitch: number;
  /** 速度（0.5-2.0） */
  rate: number;
  /** 音量（0.0-1.0） */
  volume: number;
}

/**
 * リソース管理システム
 */
export class ResourceManager {
  private audioCache: Map<string, AudioResource> = new Map();
  private imageCache: Map<string, ImageResource> = new Map();
  private ttsConfig: TTSConfig = {
    lang: 'en-US',
    pitch: 1.0,
    rate: 1.0,
    volume: 1.0
  };

  /**
   * 音声URLを取得（キャッシュ優先）
   * @param word 単語情報
   * @returns 音声URL
   */
  async getAudioUrl(word: Word): Promise<string> {
    const key = word.english.toLowerCase();

    // キャッシュ確認
    if (this.audioCache.has(key)) {
      const cached = this.audioCache.get(key)!;
      if (cached.cached) {
        return cached.url;
      }
    }

    // 1. 外部音声URLがあればそれを使用
    if (word.audioUrl) {
      await this.cacheAudio(key, word.audioUrl);
      return word.audioUrl;
    }

    // 2. ローカル音声ファイル確認
    const localUrl = `/data/audio/${key}.mp3`;
    if (await this.checkFileExists(localUrl)) {
      await this.cacheAudio(key, localUrl);
      return localUrl;
    }

    // 3. TTS生成
    return await this.generateTTS(word.english);
  }

  /**
   * 画像URLを取得
   * @param word 単語情報
   * @returns 画像URL
   */
  async getImageUrl(word: Word): Promise<string> {
    const key = word.english.toLowerCase();

    // キャッシュ確認
    if (this.imageCache.has(key)) {
      return this.imageCache.get(key)!.url;
    }

    // 1. 外部画像URLがあればそれを使用
    if (word.imageUrl) {
      this.cacheImage(key, word.imageUrl);
      return word.imageUrl;
    }

    // 2. ローカル画像確認
    const localUrl = `/data/images/${key}.jpg`;
    if (await this.checkFileExists(localUrl)) {
      this.cacheImage(key, localUrl);
      return localUrl;
    }

    // 3. フォールバック画像
    return `/data/images/placeholder.png`;
  }

  /**
   * TTS音声生成
   * @param text 生成する音声
   * @returns 音声URL（Blob URL）
   */
  private async generateTTS(text: string): Promise<string> {
    return new Promise((resolve) => {
      // Web Speech API使用
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.ttsConfig.lang;
        utterance.pitch = this.ttsConfig.pitch;
        utterance.rate = this.ttsConfig.rate;
        utterance.volume = this.ttsConfig.volume;

        // 音声再生（URLは返せないのでダミーURLを返す）
        // 実際の実装では、speechSynthesisを直接再生する
        speechSynthesis.speak(utterance);
        resolve('tts://generated'); // ダミーURL
      } else {
        // Fallback: 音声なし
        resolve('');
      }
    });
  }

  /**
   * 音声をキャッシュ
   * @param key キー（単語）
   * @param url 音声URL
   */
  private async cacheAudio(key: string, url: string): Promise<void> {
    const audio = new Audio(url);

    // プリロード
    return new Promise((resolve) => {
      audio.addEventListener('canplaythrough', () => {
        this.audioCache.set(key, {
          word: key,
          url,
          cached: true,
          audio
        });
        resolve();
      });
      audio.addEventListener('error', () => {
        // エラー時もキャッシュに登録（無限リトライ防止）
        this.audioCache.set(key, {
          word: key,
          url,
          cached: false
        });
        resolve();
      });
      audio.load();
    });
  }

  /**
   * 画像をキャッシュ
   * @param key キー（単語）
   * @param url 画像URL
   */
  private cacheImage(key: string, url: string): void {
    // 画像プリロード
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.imageCache.set(key, {
        word: key,
        url,
        cached: true
      });
    };
    img.onerror = () => {
      this.imageCache.set(key, {
        word: key,
        url,
        cached: false
      });
    };
  }

  /**
   * ファイル存在確認
   * @param url ファイルURL
   * @returns 存在する場合true
   */
  private async checkFileExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 音声を再生
   * @param word 単語情報
   */
  async playAudio(word: Word): Promise<void> {
    const url = await this.getAudioUrl(word);

    // TTS生成の場合（Web Speech API直接再生）
    if (url === 'tts://generated') {
      return; // すでにspeechSynthesis.speak()で再生済み
    }

    // 通常の音声ファイル再生
    if (url) {
      const audio = new Audio(url);
      return new Promise((resolve, reject) => {
        audio.addEventListener('ended', () => resolve());
        audio.addEventListener('error', () => reject());
        audio.play();
      });
    }
  }

  /**
   * 複数単語の音声を事前読み込み
   * @param words 単語リスト
   */
  async preloadAudios(words: Word[]): Promise<void> {
    const promises = words.map(word => this.getAudioUrl(word));
    await Promise.all(promises);
  }

  /**
   * 複数単語の画像を事前読み込み
   * @param words 単語リスト
   */
  async preloadImages(words: Word[]): Promise<void> {
    const promises = words.map(word => this.getImageUrl(word));
    await Promise.all(promises);
  }

  /**
   * TTS設定を更新
   * @param config TTS設定
   */
  updateTTSConfig(config: Partial<TTSConfig>): void {
    this.ttsConfig = { ...this.ttsConfig, ...config };
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.audioCache.clear();
    this.imageCache.clear();
  }

  /**
   * キャッシュ統計を取得
   */
  getCacheStats(): {
    audioCount: number;
    imageCount: number;
    audioCached: number;
    imageCached: number;
  } {
    const audioCount = this.audioCache.size;
    const imageCount = this.imageCache.size;
    const audioCached = Array.from(this.audioCache.values()).filter(a => a.cached).length;
    const imageCached = Array.from(this.imageCache.values()).filter(i => i.cached).length;

    return {
      audioCount,
      imageCount,
      audioCached,
      imageCached
    };
  }
}

// シングルトンインスタンス
export const resourceManager = new ResourceManager();
