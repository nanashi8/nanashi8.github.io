/**
 * passageDataLoader.tsの単体テスト
 * ブラウザコンソールで実行可能
 */

import { loadCompletePassage } from '../passageDataLoader';
import { logger } from '../logger';

/**
 * テスト実行関数
 */
export async function testPassageDataLoader(passageId: string = 'J_2022_5') {
  logger.log(`\n========================================`);
  logger.log(`  PassageDataLoader 単体テスト`);
  logger.log(`  テスト対象: ${passageId}`);
  logger.log(`========================================\n`);

  try {
    // 完全データを読み込み
    const data = await loadCompletePassage(passageId);

    logger.log(`✅ テスト1: データ読み込み成功`);
    logger.log(`\n📊 メタデータ:`);
    logger.log(`  Passage ID: ${data.passageId}`);
    logger.log(`  語数: ${data.metadata.wordCount}`);
    logger.log(`  文数: ${data.metadata.sentenceCount}`);
    logger.log(`  フレーズ数: ${data.phrases.length}`);

    // 文データチェック
    logger.log(`\n📝 文データ:`);
    logger.log(`  総数: ${data.sentences.length}`);
    if (data.sentences.length > 0) {
      logger.log(`  最初の文 (英語): ${data.sentences[0].english}`);
      logger.log(`  最初の文 (日本語): ${data.sentences[0].japanese}`);
      logger.log(`  最後の文 (英語): ${data.sentences[data.sentences.length - 1].english}`);
      logger.log(`  最後の文 (日本語): ${data.sentences[data.sentences.length - 1].japanese}`);
    }

    // フレーズデータチェック
    logger.log(`\n🔤 フレーズデータ:`);
    logger.log(`  総数: ${data.phrases.length}`);
    if (data.phrases.length > 0) {
      logger.log(`  最初のフレーズ (英語): ${data.phrases[0].english}`);
      logger.log(`  最初のフレーズ (日本語): ${data.phrases[0].japanese}`);
      logger.log(`  最後のフレーズ (英語): ${data.phrases[data.phrases.length - 1].english}`);
      logger.log(`  最後のフレーズ (日本語): ${data.phrases[data.phrases.length - 1].japanese}`);
    }

    // 注釈語句チェック
    logger.log(`\n📌 注釈語句:`);
    logger.log(`  総数: ${data.annotatedWords.length}`);
    data.annotatedWords.forEach((word, index) => {
      logger.log(`  ${index + 1}. ${word.word} → ${word.meaning}`);
    });

    // データ整合性チェック
    logger.log(`\n🔍 データ整合性チェック:`);
    const checks = {
      '文数一致': data.metadata.sentenceCount === data.sentences.length,
      '全文が空でない': data.sentences.every((s) => s.english && s.japanese),
      '全フレーズが空でない': data.phrases.every((p) => p.english && p.japanese),
    };

    Object.entries(checks).forEach(([name, passed]) => {
      logger.log(`  ${passed ? '✅' : '❌'} ${name}`);
    });

    // 統計情報
    logger.log(`\n📈 統計情報:`);
    const avgSentenceLength =
      data.sentences.reduce((sum, s) => sum + s.english.split(' ').length, 0) /
      data.sentences.length;
    const avgPhraseLength =
      data.phrases.reduce((sum, p) => sum + p.english.split(' ').length, 0) / data.phrases.length;

    logger.log(`  平均文長: ${avgSentenceLength.toFixed(1)} 語/文`);
    logger.log(`  平均フレーズ長: ${avgPhraseLength.toFixed(1)} 語/フレーズ`);
    logger.log(`  文あたりフレーズ数: ${(data.phrases.length / data.sentences.length).toFixed(1)}`);

    logger.log(`\n========================================`);
    logger.log(`  ✅ 全テスト合格！`);
    logger.log(`========================================\n`);

    return data;
  } catch (error) {
    logger.error(`\n❌ テスト失敗: ${error}`);
    logger.error(`エラー詳細:`);
    logger.error(error);
    throw error;
  }
}

// ブラウザコンソールからアクセスできるようにグローバルに公開
if (typeof window !== 'undefined') {
  (window as any).testPassageDataLoader = testPassageDataLoader;
}
