/**
 * 重要語句の抽出ユーティリティ
 */

import type { SentenceData, KeyPhrase } from '@/types/passage';

/**
 * 文のリストから重要語句を抽出する
 *
 * 現在は簡易実装：句動詞と一般的なフレーズを検出
 */
export function extractKeyPhrasesFromSentences(sentences: SentenceData[]): KeyPhrase[] {
  const keyPhrases: KeyPhrase[] = [];
  const phrasePatterns = [
    { pattern: /\bwake up\b/gi, phrase: 'wake up', meaning: '起きる（句動詞）' },
    { pattern: /\bget (.*?) ready\b/gi, phrase: 'get ready', meaning: '準備する' },
    { pattern: /\bbrush (one's|my|your|his|her|their) teeth\b/gi, phrase: 'brush teeth', meaning: '歯を磨く' },
    { pattern: /\bwash (one's|my|your|his|her|their) face\b/gi, phrase: 'wash face', meaning: '顔を洗う' },
    { pattern: /\bput (.*?) inside\b/gi, phrase: 'put inside', meaning: '中に入れる' },
    { pattern: /\bwalk to\b/gi, phrase: 'walk to', meaning: '～まで歩く' },
  ];

  sentences.forEach((sentence) => {
    phrasePatterns.forEach(({ pattern, phrase, meaning }) => {
      if (pattern.test(sentence.english)) {
        // 同じフレーズが既に存在するか確認
        const existing = keyPhrases.find((kp) => kp.phrase === phrase);
        if (existing) {
          // 既存の位置に追加
          if (!existing.positions.includes(sentence.id)) {
            existing.positions.push(sentence.id);
          }
        } else {
          // 新規追加
          keyPhrases.push({
            phrase,
            meaning,
            type: 'phrasal-verb',
            positions: [sentence.id],
          });
        }
      }
    });
  });

  return keyPhrases;
}
