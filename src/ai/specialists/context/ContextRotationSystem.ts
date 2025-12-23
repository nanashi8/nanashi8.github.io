/**
 * ContextRotationSystem - 文脈変更システム
 *
 * **役割**: 同じ単語を異なる文脈・方法で復習し、深い定着を促進
 *
 * **復習方法（5種類）**:
 * 1. RECOGNITION: 認識テスト（英 → 日）- 最も簡単
 * 2. RECALL: 想起テスト（日 → 英）- 中級
 * 3. SENTENCE: 文脈テスト（穴埋め）- 応用
 * 4. LISTENING: 聴覚テスト（音声 → 書き取り）- 高度
 * 5. PRODUCTION: 産出テスト（画像 → 英語）- 最高難度
 *
 * **アルゴリズム**:
 * - 初回: RECOGNITION（簡単な認識から）
 * - 2-3回目: RECALL（想起練習）
 * - 4-6回目: SENTENCE（文脈理解）
 * - 7回以上: ランダム（多様性確保）
 * - 高正答率: LISTENING/PRODUCTION追加
 *
 * Phase 6: 多様な復習方法統合
 */

import type { WordProgress } from '../../../storage/progress/types';

/**
 * 復習方法（5種類）
 */
export enum ReviewMethod {
  /** 認識テスト: 英語 → 日本語意味を選択 */
  RECOGNITION = 'recognition',
  /** 想起テスト: 日本語 → 英語を入力 */
  RECALL = 'recall',
  /** 文脈テスト: 例文穴埋め */
  SENTENCE = 'sentence',
  /** 聴覚テスト: 音声 → 書き取り */
  LISTENING = 'listening',
  /** 産出テスト: 画像/状況 → 英語で表現 */
  PRODUCTION = 'production'
}

/**
 * 単語情報（問題生成用）
 */
export interface Word {
  /** 英単語 */
  english: string;
  /** 日本語意味 */
  japanese: string;
  /** 例文 */
  exampleSentence?: string;
  /** 音声URL */
  audioUrl?: string;
  /** 画像URL */
  imageUrl?: string;
  /** 発音情報 */
  pronunciation?: {
    ipa?: string;
    audio?: string;
  };
  /** 画像URL */
  image?: string;
  /** 品詞 */
  partOfSpeech?: string;
}

/**
 * 問題バリエーション
 */
export interface QuestionVariant {
  /** 問題タイプ */
  type: ReviewMethod;
  /** 問題文 */
  prompt: string;
  /** 正解 */
  answer: string;
  /** 指示文 */
  instruction: string;
  /** ヒント（optional） */
  hint?: string;
  /** 音声URL（LISTENINGの場合） */
  audioUrl?: string;
  /** 画像URL（PRODUCTIONの場合） */
  imageUrl?: string;
  /** 選択肢（RECOGNITIONの場合） */
  choices?: string[];
}

/**
 * ContextRotationSystem - 文脈変更システム
 */
export class ContextRotationSystem {
  /**
   * 試行回数と正答率に応じた復習方法の選択
   *
   * @param word 単語情報
   * @param progress 学習進捗
   * @returns 最適な復習方法
   */
  selectReviewMethod(
    word: Word,
    progress: WordProgress
  ): ReviewMethod {
    const attempts = progress.memorizationAttempts || 0;
    const correct = progress.memorizationCorrect || 0;
    const accuracy = attempts > 0 ? correct / attempts : 0;

    // === 段階的な方法選択 ===

    // 初回: 認識テスト（最も簡単）
    if (attempts === 0) {
      return ReviewMethod.RECOGNITION;
    }

    // 2-3回目: 想起テスト（中級）
    if (attempts <= 3) {
      return ReviewMethod.RECALL;
    }

    // 4-6回目: 文脈テスト（応用）- 正答率70%以上なら
    if (attempts <= 6 && accuracy >= 0.7) {
      return ReviewMethod.SENTENCE;
    }

    // 4-6回目で正答率低い → 想起テストに戻す
    if (attempts <= 6 && accuracy < 0.7) {
      return ReviewMethod.RECALL;
    }

    // 7回以上: ランダムで多様性確保
    return this.selectRandomMethod(accuracy);
  }

  /**
   * ランダムに復習方法を選択（正答率に応じて選択肢調整）
   */
  private selectRandomMethod(accuracy: number): ReviewMethod {
    const methods: ReviewMethod[] = [
      ReviewMethod.RECOGNITION,
      ReviewMethod.RECALL,
      ReviewMethod.SENTENCE
    ];

    // 正答率80%以上 → 高度な方法も追加
    if (accuracy >= 0.8) {
      methods.push(ReviewMethod.LISTENING, ReviewMethod.PRODUCTION);
    }

    // ランダム選択
    return methods[Math.floor(Math.random() * methods.length)];
  }

  /**
   * 復習方法に応じた問題を生成
   *
   * @param word 単語情報
   * @param method 復習方法
   * @param distractors 誤答選択肢（RECOGNITIONの場合）
   * @returns 問題バリエーション
   */
  generateQuestion(
    word: Word,
    method: ReviewMethod,
    distractors?: string[]
  ): QuestionVariant {
    switch (method) {
      case ReviewMethod.RECOGNITION:
        return this.generateRecognitionQuestion(word, distractors);

      case ReviewMethod.RECALL:
        return this.generateRecallQuestion(word);

      case ReviewMethod.SENTENCE:
        return this.generateSentenceQuestion(word);

      case ReviewMethod.LISTENING:
        return this.generateListeningQuestion(word);

      case ReviewMethod.PRODUCTION:
        return this.generateProductionQuestion(word);
    }
  }

  /**
   * 認識テスト: 英語 → 日本語意味を選択
   */
  private generateRecognitionQuestion(
    word: Word,
    distractors?: string[]
  ): QuestionVariant {
    // 選択肢を生成（正解 + 誤答3つ）
    const choices = distractors && distractors.length >= 3
      ? [word.japanese, ...distractors.slice(0, 3)]
      : [word.japanese, '他の意味1', '他の意味2', '他の意味3'];

    // シャッフル
    const shuffledChoices = this.shuffleArray([...choices]);

    return {
      type: ReviewMethod.RECOGNITION,
      prompt: word.english,
      answer: word.japanese,
      instruction: 'この単語の意味を選んでください',
      choices: shuffledChoices
    };
  }

  /**
   * 想起テスト: 日本語 → 英語を入力
   */
  private generateRecallQuestion(word: Word): QuestionVariant {
    return {
      type: ReviewMethod.RECALL,
      prompt: word.japanese,
      answer: word.english,
      instruction: '英語で答えてください',
      hint: `${word.english.length}文字`
    };
  }

  /**
   * 文脈テスト: 例文穴埋め
   */
  private generateSentenceQuestion(word: Word): QuestionVariant {
    // 例文がない場合はデフォルト生成
    const sentence = word.exampleSentence ||
      this.generateDefaultSentence(word);

    // 単語を空欄に置き換え（大文字小文字両方対応）
    const blankedSentence = sentence
      .replace(new RegExp(word.english, 'gi'), '____');

    return {
      type: ReviewMethod.SENTENCE,
      prompt: blankedSentence,
      answer: word.english,
      instruction: '空欄に入る単語を答えてください',
      hint: `${word.english.length}文字の単語`
    };
  }

  /**
   * 聴覚テスト: 音声 → 書き取り
   */
  private generateListeningQuestion(word: Word): QuestionVariant {
    return {
      type: ReviewMethod.LISTENING,
      prompt: '音声を聞いて、単語を書き取ってください',
      answer: word.english,
      instruction: '🔊 音声を再生して答えてください',
      audioUrl: word.pronunciation?.audio,
      hint: `${word.english.length}文字`
    };
  }

  /**
   * 産出テスト: 画像/状況 → 英語で表現
   */
  private generateProductionQuestion(word: Word): QuestionVariant {
    return {
      type: ReviewMethod.PRODUCTION,
      prompt: word.japanese,
      answer: word.english,
      instruction: 'この意味を英語で表現してください',
      imageUrl: word.image,
      hint: word.partOfSpeech ? `品詞: ${word.partOfSpeech}` : undefined
    };
  }

  /**
   * デフォルト例文生成
   */
  private generateDefaultSentence(word: Word): string {
    const templates = [
      `I use ${word.english} every day.`,
      `This ${word.english} is very useful.`,
      `Can you explain ${word.english}?`,
      `We need more ${word.english}.`,
      `The ${word.english} is important.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * 配列シャッフル（Fisher-Yates）
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 復習方法の履歴記録
   *
   * 同じ方法が3回連続しないように制御
   */
  recordMethodUsage(
    _progress: WordProgress,
    _method: ReviewMethod
  ): void {
    // TODO: progressに methodHistory フィールドを追加して記録
    // 例: progress.methodHistory = [...(progress.methodHistory || []), { method, timestamp: Date.now() }]
  }

  /**
   * 最近使用した方法の確認
   *
   * 多様性確保のため、最近使った方法を避ける
   */
  getRecentMethods(_progress: WordProgress, _count: number = 3): ReviewMethod[] {
    // TODO: progressのmethodHistory から最近の方法を取得
    // 現状は空配列を返す
    return [];
  }
}
