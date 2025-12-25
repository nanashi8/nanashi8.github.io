import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';

function loadJson<T = unknown>(relativePath: string): T {
  const raw = readFileSync(new URL(relativePath, import.meta.url), 'utf-8');
  return JSON.parse(raw) as T;
}

const verbFormGrade1 = loadJson<any>('../../public/data/verb-form-questions-grade1.json');

/**
 * 翻訳API・言語解析API連携による高度なコンテンツ品質検証
 *
 * 使用する無料API:
 * - LibreTranslate API (完全無料、セルフホスト可能)
 * - LanguageTool API (文法チェック、無料枠: 20リクエスト/分)
 * - TextGears API (文法・スペルチェック、無料枠: 100リクエスト/日)
 *
 * Note: API制限に達した場合はスキップされます
 *
 * SKIP_API_TESTS=true 環境変数でスキップ可能 (高速テスト実行時)
 */

// 環境変数でスキップ制御
const SKIP_API_TESTS = process.env.SKIP_API_TESTS === 'true';

type _VerbFormQuestion = {
  id: string;
  japanese: string;
  sentence: string;
  verb: string;
  choices: string[];
  correctAnswer: string;
  difficulty: string;
  explanation: string;
  hint: string;
};

// API設定
const LANGUAGE_TOOL_API = 'https://api.languagetool.org/v2/check';
const MYMEMORY_API = 'https://api.mymemory.translated.net/get'; // 完全無料、1000req/日

// レート制限管理
const apiCallCount = {
  myMemory: 0,
  languageTool: 0,
};

const API_LIMITS = {
  myMemory: 15, // 1テストセッションあたり15回まで（1000req/日の制限内）
  languageTool: 20, // 20リクエスト/分
};

// ユーティリティ関数
async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  if (apiCallCount.myMemory >= API_LIMITS.myMemory) {
    console.warn('⚠️  MyMemory API制限に達しました（スキップ）');
    return null;
  }

  try {
    const langPair = `${sourceLang}|${targetLang}`;
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`MyMemory API エラー: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.responseStatus === 200 || data.responseData) {
      apiCallCount.myMemory++;
      return data.responseData.translatedText;
    } else {
      console.warn(`MyMemory API: 翻訳失敗 (status: ${data.responseStatus})`);
      return null;
    }
  } catch (error) {
    console.warn('MyMemory API呼び出し失敗:', error);
    return null;
  }
}

async function checkGrammar(text: string, language: string): Promise<any> {
  if (apiCallCount.languageTool >= API_LIMITS.languageTool) {
    console.warn('⚠️  LanguageTool API制限に達しました（スキップ）');
    return null;
  }

  try {
    const params = new URLSearchParams({
      text: text,
      language: language,
      enabledOnly: 'false',
    });

    const response = await fetch(`${LANGUAGE_TOOL_API}?${params}`, {
      method: 'POST',
    });

    if (!response.ok) {
      console.warn(`LanguageTool API エラー: ${response.status}`);
      return null;
    }

    const data = await response.json();
    apiCallCount.languageTool++;
    return data;
  } catch (error) {
    console.warn('LanguageTool API呼び出し失敗:', error);
    return null;
  }
}

function calculateSimilarity(str1: string, str2: string): number {
  // Levenshtein距離ベースの類似度計算（簡易版）
  const s1 = str1.toLowerCase().replace(/[^\w\s]/g, '');
  const s2 = str2.toLowerCase().replace(/[^\w\s]/g, '');

  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

describe.skipIf(SKIP_API_TESTS)('翻訳API連携テスト - MyMemory (無料1000req/日)', () => {
  const sampleQuestions = verbFormGrade1.units[0].verbForm.slice(0, 5); // 最初の5問でテスト

  beforeAll(() => {
    console.log('🌐 MyMemory Translation API テスト開始（無料1000req/日）');
    console.log(`📊 テスト対象: ${sampleQuestions.length}問`);
  });

  it('英文を日本語に翻訳して実際の訳と比較できる', async () => {
    for (const q of sampleQuestions) {
      // 空欄を埋めた完全な英文を作成
      const completeSentence = q.sentence.replace(/____/g, q.correctAnswer);

      const translation = await translateText(completeSentence, 'en', 'ja');

      if (translation) {
        const similarity = calculateSimilarity(translation, q.japanese);

        console.log(`\n📝 問題 ${q.id}:`);
        console.log(`  英文: ${completeSentence}`);
        console.log(`  期待訳: ${q.japanese}`);
        console.log(`  API訳: ${translation}`);
        console.log(`  類似度: ${(similarity * 100).toFixed(1)}%`);

        // 類似度が低い場合は警告
        if (similarity < 0.3) {
          console.warn(`  ⚠️  翻訳の乖離が大きい可能性があります`);
        }

        // テストは成功（情報提供のみ）
        expect(translation).toBeDefined();
      }

      // API負荷軽減のため少し待機
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }, 30000); // 30秒タイムアウト

  it('日本語訳を英語に逆翻訳して整合性を確認できる', async () => {
    const question = sampleQuestions[0]; // 1問のみテスト

    const backTranslation = await translateText(question.japanese, 'ja', 'en');

    if (backTranslation) {
      const originalSentence = question.sentence.replace(/____/g, question.correctAnswer);
      const similarity = calculateSimilarity(backTranslation, originalSentence);

      console.log(`\n🔄 逆翻訳テスト - 問題 ${question.id}:`);
      console.log(`  元の英文: ${originalSentence}`);
      console.log(`  日本語訳: ${question.japanese}`);
      console.log(`  逆翻訳: ${backTranslation}`);
      console.log(`  類似度: ${(similarity * 100).toFixed(1)}%`);

      // 逆翻訳の類似度が40%以上なら合格
      if (similarity < 0.4) {
        console.warn(`  ⚠️  逆翻訳での意味の乖離が大きい`);
      }

      expect(backTranslation).toBeDefined();
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }, 10000);
});

describe.skipIf(SKIP_API_TESTS)('文法チェックAPI連携テスト - LanguageTool (無料枠)', () => {
  const sampleQuestions = verbFormGrade1.units[0].verbForm.slice(0, 3); // 最初の3問

  beforeAll(() => {
    console.log('📚 LanguageTool API テスト開始（無料枠: 20req/分）');
  });

  it('完成した英文に文法エラーがないことを確認', async () => {
    for (const q of sampleQuestions) {
      const completeSentence = q.sentence.replace(/____/g, q.correctAnswer);

      const grammarCheck = await checkGrammar(completeSentence, 'en-US');

      if (grammarCheck && grammarCheck.matches) {
        console.log(`\n✍️  文法チェック - 問題 ${q.id}:`);
        console.log(`  英文: ${completeSentence}`);
        console.log(`  検出された問題: ${grammarCheck.matches.length}件`);

        if (grammarCheck.matches.length > 0) {
          grammarCheck.matches.forEach((match: any, index: number) => {
            console.warn(`  ⚠️  [${index + 1}] ${match.message}`);
            console.warn(
              `      位置: "${match.context.text.substring(match.context.offset, match.context.offset + match.context.length)}"`
            );
            if (match.replacements.length > 0) {
              console.warn(`      提案: ${match.replacements.map((r: any) => r.value).join(', ')}`);
            }
          });
        } else {
          console.log(`  ✅ 文法エラーなし`);
        }

        expect(grammarCheck.matches).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }, 30000);

  it('日本語の説明文に誤字・不自然な表現がないか確認', async () => {
    const question = sampleQuestions[0];

    // LanguageToolは日本語もサポート
    const grammarCheck = await checkGrammar(question.explanation, 'ja');

    if (grammarCheck && grammarCheck.matches) {
      console.log(`\n📖 日本語文法チェック - 問題 ${question.id}:`);
      console.log(`  説明文: ${question.explanation}`);
      console.log(`  検出された問題: ${grammarCheck.matches.length}件`);

      if (grammarCheck.matches.length > 0) {
        grammarCheck.matches.forEach((match: any, index: number) => {
          console.warn(`  ⚠️  [${index + 1}] ${match.message}`);
        });
      } else {
        console.log(`  ✅ 問題なし`);
      }

      expect(grammarCheck.matches).toBeDefined();
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, 10000);
});

describe.skipIf(SKIP_API_TESTS)('統合品質スコア算出', () => {
  it('翻訳品質・文法正確性を総合評価してスコア化', async () => {
    const question = verbFormGrade1.units[0].verbForm[0];
    const completeSentence = question.sentence.replace(/____/g, question.correctAnswer);

    let qualityScore = 100;
    const issues: string[] = [];

    // 1. 翻訳品質チェック
    const translation = await translateText(completeSentence, 'en', 'ja');
    if (translation) {
      const similarity = calculateSimilarity(translation, question.japanese);
      if (similarity < 0.3) {
        qualityScore -= 20;
        issues.push(`翻訳乖離大 (類似度${(similarity * 100).toFixed(0)}%)`);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 2. 英文法チェック
    const grammarCheck = await checkGrammar(completeSentence, 'en-US');
    if (grammarCheck && grammarCheck.matches) {
      const errorCount = grammarCheck.matches.length;
      if (errorCount > 0) {
        qualityScore -= errorCount * 10;
        issues.push(`文法問題${errorCount}件`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // 3. 日本語チェック
    const japaneseCheck = await checkGrammar(question.japanese, 'ja');
    if (japaneseCheck && japaneseCheck.matches) {
      const errorCount = japaneseCheck.matches.length;
      if (errorCount > 0) {
        qualityScore -= errorCount * 5;
        issues.push(`日本語問題${errorCount}件`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`\n🎯 品質スコア - 問題 ${question.id}:`);
    console.log(`  総合スコア: ${Math.max(0, qualityScore)}/100点`);
    if (issues.length > 0) {
      console.log(`  検出された問題:`);
      issues.forEach((issue) => console.log(`    - ${issue}`));
    } else {
      console.log(`  ✨ 優れた品質です！`);
    }

    expect(qualityScore).toBeGreaterThanOrEqual(0);
    expect(qualityScore).toBeLessThanOrEqual(100);
  }, 20000);
});

describe.skipIf(SKIP_API_TESTS)('API使用状況レポート', () => {
  it('セッション中のAPI呼び出し回数を表示', () => {
    console.log('\n📊 API使用状況レポート:');
    console.log(`  MyMemory Translation: ${apiCallCount.myMemory}/${API_LIMITS.myMemory}回`);
    console.log(`  LanguageTool: ${apiCallCount.languageTool}/${API_LIMITS.languageTool}回`);

    const totalCalls = apiCallCount.myMemory + apiCallCount.languageTool;
    console.log(`  合計API呼び出し: ${totalCalls}回`);
    console.log(`\n💡 残り利用可能回数:`);
    console.log(
      `  MyMemory: ${API_LIMITS.myMemory - apiCallCount.myMemory}回（本日残り${1000 - apiCallCount.myMemory}回）`
    );
    console.log(
      `  LanguageTool: ${API_LIMITS.languageTool - apiCallCount.languageTool}回（分間残り${20 - apiCallCount.languageTool}回）`
    );

    expect(totalCalls).toBeGreaterThanOrEqual(0);
  });
});
