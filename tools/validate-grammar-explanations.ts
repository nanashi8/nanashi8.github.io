/// <reference types="node" />
/**
 * 文法問題の解説品質チェックツール
 *
 * 目的: 手抜き解説を防止し、学習者にとって有益な詳細説明を強制する
 *
 * チェック項目:
 * 1. 比較級問題: more/erの使い分け（音節数）の説明が必須
 * 2. 受動態問題: be動詞 + 過去分詞の説明が必須
 * 3. 現在完了問題: have/has + 過去分詞の形式と用法の説明が必須
 * 4. 不定詞問題: to + 動詞の原形の説明が必須
 * 5. 関係代名詞問題: 先行詞との関係の説明が必須
 * 6. 最小文字数: 解説は最低50文字以上必須
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GrammarQuestion {
  id: string;
  japanese?: string;
  sentence?: string;
  explanation?: string;
  grammarPoint?: string;
  correctAnswer?: string;
  choices?: string[];
}

interface ValidationError {
  file: string;
  questionId: string;
  errorType: string;
  message: string;
  suggestion: string;
}

const MIN_EXPLANATION_LENGTH = 50;

// 文法ポイント別の必須キーワード
const REQUIRED_KEYWORDS: Record<string, string[]> = {
  '比較級': ['音節', 'more', '-er', '使い分け'],
  '最上級': ['最も', 'most', '-est', '使い分け'],
  '受動態': ['be動詞', '過去分詞', 'される'],
  '現在完了': ['have', 'has', '過去分詞', '経験', '完了', '継続', '結果'],
  '不定詞': ['to', '原形', '名詞的', '副詞的', '形容詞的'],
  '動名詞': ['-ing', '名詞', '主語', '目的語'],
  '関係代名詞': ['先行詞', 'which', 'who', 'that', '修飾'],
  '間接疑問文': ['疑問詞', '語順', '平叙文'],
  '仮定法': ['もし', '過去形', 'would', '事実に反する'],
};

// 特定パターンの詳細説明が必要なケース
const DETAILED_EXPLANATION_PATTERNS = [
  {
    pattern: /more\s+\w+ing/i,
    keywords: ['音節', '長い形容詞', '-er', 'つけ'],
    errorMessage: 'more + 形容詞の使い分け（音節数による理由）が説明されていません',
    suggestion: '例: "interestingは3音節の長い形容詞なので、語尾に-erをつけず「more + 形容詞」の形を使います。短い形容詞（1～2音節）にはtaller、smarterのように-erをつけますが、長い形容詞（3音節以上）にはmore interesting、more beautifulのようにmoreを前につけます。"'
  },
  {
    pattern: /more\s+(beautiful|difficult|important|interesting|popular|comfortable)/i,
    keywords: ['音節', '長い', '-er', '使い分け'],
    errorMessage: 'more + 長い形容詞の使い分けルールが説明されていません',
    suggestion: '音節数による比較級の作り方の違いを明記してください'
  },
  {
    pattern: /\b(is|are|was|were)\s+\w+ed\b/i,
    keywords: ['be動詞', '過去分詞', '動作主', 'by'],
    errorMessage: '受動態の構造（be動詞 + 過去分詞）が十分に説明されていません',
    suggestion: '例: "受動態は「be動詞 + 過去分詞」の形で、「～される」という意味を表します。動作主はbyで表します。"'
  },
  {
    pattern: /\b(have|has)\s+\w+ed\b/i,
    keywords: ['過去分詞', '経験', '完了', '継続'],
    errorMessage: '現在完了の用法（経験・完了・継続・結果）が説明されていません',
    suggestion: '例: "現在完了は「have/has + 過去分詞」の形で、経験（～したことがある）、完了（～してしまった）、継続（ずっと～している）、結果（～した結果今～だ）を表します。"'
  },
];

function validateExplanation(question: GrammarQuestion, filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const explanation = question.explanation || '';
  const grammarPoint = question.grammarPoint || '';
  const sentence = question.sentence || question.correctAnswer || '';

  // チェック1: 解説の最小文字数
  if (explanation.length < MIN_EXPLANATION_LENGTH) {
    errors.push({
      file: filePath,
      questionId: question.id,
      errorType: '解説文字数不足',
      message: `解説が${explanation.length}文字しかありません（最低${MIN_EXPLANATION_LENGTH}文字必要）`,
      suggestion: '学習者が理解できるよう、文法ルール・使い分け・例を含めた詳細な解説を追加してください'
    });
  }

  // チェック2: 文法ポイント別の必須キーワード
  if (grammarPoint && REQUIRED_KEYWORDS[grammarPoint]) {
    const requiredKeywords = REQUIRED_KEYWORDS[grammarPoint];
    const missingKeywords = requiredKeywords.filter(keyword =>
      !explanation.includes(keyword)
    );

    if (missingKeywords.length > 0) {
      errors.push({
        file: filePath,
        questionId: question.id,
        errorType: '必須キーワード不足',
        message: `「${grammarPoint}」の解説に必須キーワードが含まれていません: ${missingKeywords.join(', ')}`,
        suggestion: `「${grammarPoint}」を説明する際は、${requiredKeywords.join('、')}などのキーワードを使って詳しく説明してください`
      });
    }
  }

  // チェック3: 特定パターンの詳細説明チェック
  for (const pattern of DETAILED_EXPLANATION_PATTERNS) {
    if (pattern.pattern.test(sentence)) {
      const hasAllKeywords = pattern.keywords.every(keyword =>
        explanation.includes(keyword)
      );

      if (!hasAllKeywords) {
        const missingKeywords = pattern.keywords.filter(keyword =>
          !explanation.includes(keyword)
        );
        errors.push({
          file: filePath,
          questionId: question.id,
          errorType: '詳細説明不足',
          message: `${pattern.errorMessage}（不足: ${missingKeywords.join(', ')}）`,
          suggestion: pattern.suggestion
        });
      }
    }
  }

  // チェック4: 一般的な手抜き表現の検出
  const lazyPhrases = [
    { phrase: 'この問題では', message: '「この問題では」だけでなく、なぜそうなるのか理由を説明してください' },
    { phrase: 'が正答です', message: '正答を述べるだけでなく、その文法ルールを詳しく説明してください' },
    { phrase: 'の語順です', message: '語順を述べるだけでなく、なぜその語順になるのか文法的理由を説明してください' },
  ];

  for (const lazy of lazyPhrases) {
    if (explanation.includes(lazy.phrase) && explanation.length < MIN_EXPLANATION_LENGTH * 1.5) {
      errors.push({
        file: filePath,
        questionId: question.id,
        errorType: '手抜き表現検出',
        message: lazy.message,
        suggestion: '文法ルール、使い分けの理由、具体例を含めた詳細な解説に書き換えてください'
      });
    }
  }

  return errors;
}

function validateGrammarFile(filePath: string): ValidationError[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  const errors: ValidationError[] = [];

  // verbForm, fillInBlank, sentenceOrdering 配列をチェック
  const questionArrays = [
    data.verbForm || [],
    data.fillInBlank || [],
    data.sentenceOrdering || []
  ];

  for (const questions of questionArrays) {
    if (Array.isArray(questions)) {
      for (const question of questions) {
        const questionErrors = validateExplanation(question, filePath);
        errors.push(...questionErrors);
      }
    }
  }

  return errors;
}

function main() {
  const grammarDir = path.join(__dirname, '../public/data/grammar');
  const files = fs.readdirSync(grammarDir).filter((f: string) => f.endsWith('.json'));

  let totalErrors = 0;
  const errorsByFile: Record<string, ValidationError[]> = {};

  console.log('🔍 文法問題の解説品質チェックを開始します...\n');

  for (const file of files) {
    const filePath = path.join(grammarDir, file);
    const errors = validateGrammarFile(filePath);

    if (errors.length > 0) {
      errorsByFile[file] = errors;
      totalErrors += errors.length;
    }
  }

  if (totalErrors === 0) {
    console.log('✅ すべての解説が品質基準を満たしています！\n');
    process.exit(0);
  } else {
    console.log(`❌ ${totalErrors}件の問題が見つかりました\n`);

    for (const [file, errors] of Object.entries(errorsByFile)) {
      console.log(`\n📄 ${file}: ${errors.length}件の問題`);
      console.log('='.repeat(80));

      for (const error of errors) {
        console.log(`\n問題ID: ${error.questionId}`);
        console.log(`エラー種別: ${error.errorType}`);
        console.log(`問題: ${error.message}`);
        console.log(`改善案: ${error.suggestion}`);
        console.log('-'.repeat(80));
      }
    }

    console.log('\n\n⚠️  解説の品質基準を満たしていない問題があります。');
    console.log('上記の改善案を参考に、すべての解説を詳細かつ教育的な内容に修正してください。\n');
    process.exit(1);
  }
}

main();
