/// <reference types="node" />

/**
 * 社会科CSV→JSON変換スクリプト
 *
 * local-data-packs/social-studies*.csvを読み込み、
 * public/data/social-studies/*.jsonに変換します。
 *
 * 実行方法:
 *   npm run convert-social-studies
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== 型定義 =====

type RelationType =
  | 'related'
  | 'cause'
  | 'effect'
  | 'chronological_before'
  | 'chronological_after'
  | 'person_achievement'
  | 'location_event';

interface SocialStudiesQuestion {
  term: string;
  reading: string;
  matter: string;
  question: string;
  explanation: string;
  relatedMatters: string;
  relatedFields: string;
  difficulty: number;
  source: 'junior';
  year?: number;
  choiceHints: string;
}

interface SocialStudiesRelationship {
  sourceTerm: string;
  targetTerm: string;
  strength: number;
  relationType: RelationType;
}

interface CSVRow {
  語句: string;
  読み: string;
  事項: string;
  問題文: string;
  説明: string;
  関連事項: string;
  関連分野: string;
  難易度: string;
  source: string;
  年代: string;
  選択肢生成ヒント: string;
}

// ===== CSV解析 =====

// ヘッダーマッピング（英語→日本語）
const HEADER_MAP: Record<string, string> = {
  'term': '語句',
  'reading': '読み',
  'matter': '事項',
  'question': '問題文',
  'explanation': '説明',
  'relatedMatters': '関連事項',
  'relatedFields': '関連分野',
  'difficulty': '難易度',
  'year': '年代',
  'choiceHints': '選択肢生成ヒント'
};

function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n').filter((line) => line.trim() !== '');
  if (lines.length < 2) {
    throw new Error('CSVファイルにデータがありません');
  }

  const header = lines[0].split(',').map(h => h.trim());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== header.length) {
      console.warn(`⚠️ 行 ${i + 1}: 列数が一致しません（スキップ）`);
      continue;
    }

    const row: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      // 英語ヘッダーなら日本語に変換、そうでなければそのまま
      const key = HEADER_MAP[header[j]] || header[j];
      row[key] = values[j];
    }
    rows.push(row as unknown as CSVRow);
  }

  return rows;
}

// ===== 関連事項のパース =====

function parseRelatedMatters(
  relatedMattersStr: string
): Array<{ term: string; type: RelationType }> {
  if (!relatedMattersStr || relatedMattersStr.trim() === '') {
    return [];
  }

  return relatedMattersStr.split('|').map((item) => {
    const trimmed = item.trim();

    if (trimmed.startsWith('→')) {
      return { term: trimmed.substring(1), type: 'cause' as RelationType };
    } else if (trimmed.startsWith('←')) {
      return { term: trimmed.substring(1), type: 'effect' as RelationType };
    } else if (trimmed.startsWith('・')) {
      return { term: trimmed.substring(1), type: 'related' as RelationType };
    } else {
      return { term: trimmed, type: 'related' as RelationType };
    }
  });
}

// ===== 時系列関連の自動生成 =====

function generateChronologicalRelations(
  questions: SocialStudiesQuestion[],
  maxYearDiff: number = 50
): SocialStudiesRelationship[] {
  const relations: SocialStudiesRelationship[] = [];

  // 年代情報がある問題のみ抽出
  const questionsWithYear = questions.filter((q) => q.year !== undefined);

  for (let i = 0; i < questionsWithYear.length; i++) {
    for (let j = i + 1; j < questionsWithYear.length; j++) {
      const q1 = questionsWithYear[i];
      const q2 = questionsWithYear[j];

      const yearDiff = Math.abs(q1.year! - q2.year!);
      if (yearDiff <= maxYearDiff) {
        // 年代が近い場合、時系列関連として登録
        if (q1.year! < q2.year!) {
          relations.push({
            sourceTerm: q1.term,
            targetTerm: q2.term,
            strength: Math.max(50, 100 - yearDiff),
            relationType: 'chronological_before',
          });
        } else {
          relations.push({
            sourceTerm: q2.term,
            targetTerm: q1.term,
            strength: Math.max(50, 100 - yearDiff),
            relationType: 'chronological_before',
          });
        }
      }
    }
  }

  return relations;
}

// ===== CSV→JSON変換 =====

// difficulty文字列→数値マッピング
function parseDifficulty(diffStr: string): number {
  const normalized = diffStr.trim().toLowerCase();
  if (normalized === 'beginner' || normalized === '初級' || normalized === '1') return 1;
  if (normalized === 'intermediate' || normalized === '中級' || normalized === '3') return 3;
  if (normalized === 'advanced' || normalized === '上級' || normalized === '5') return 5;
  // 数値の場合
  const num = parseInt(diffStr, 10);
  if (!isNaN(num) && num >= 1 && num <= 5) return num;
  // デフォルト
  return 3;
}

// 年代文字列→数値変換（紀元前、西暦、年号など）
function parseYear(yearStr: string): number | undefined {
  if (!yearStr || yearStr.trim() === '') return undefined;
  const trimmed = yearStr.trim();
  
  // 「紀元前1万年」「紀元前300年」などの処理
  if (trimmed.includes('紀元前')) {
    const match = trimmed.match(/紀元前(\d+)/);
    if (match) return -parseInt(match[1], 10);
  }
  
  // 普通の数値（4桁の西暦など）
  const num = parseInt(trimmed, 10);
  if (!isNaN(num)) return num;
  
  return undefined;
}

function convertCSVRow(row: CSVRow): SocialStudiesQuestion {
  const question: SocialStudiesQuestion = {
    term: row['語句'],
    reading: row['読み'],
    matter: row['事項'],
    question: row['問題文'],
    explanation: row['説明'],
    relatedMatters: row['関連事項'],
    relatedFields: row['関連分野'],
    difficulty: parseDifficulty(row['難易度']),
    source: 'junior',
    choiceHints: row['選択肢生成ヒント'],
  };

  // 年代（歴史のみ）
  const year = parseYear(row['年代']);
  if (year !== undefined) {
    question.year = year;
  }

  return question;
}

// ===== 関連情報の抽出 =====

function extractRelationships(questions: SocialStudiesQuestion[]): SocialStudiesRelationship[] {
  const relationships: SocialStudiesRelationship[] = [];
  const termMap = new Map<string, SocialStudiesQuestion>();

  // 語句マップ作成
  for (const q of questions) {
    termMap.set(q.term, q);
  }

  // CSVの関連事項から関連を抽出
  for (const q of questions) {
    const relatedItems = parseRelatedMatters(q.relatedMatters);

    for (const item of relatedItems) {
      const target = termMap.get(item.term);
      if (!target) {
        console.warn(`⚠️ 語句「${q.term}」の関連事項「${item.term}」が見つかりません`);
        continue;
      }

      // 関連タイプに応じた強度
      let strength = 70; // デフォルト
      if (item.type === 'cause' || item.type === 'effect') {
        strength = 90; // 因果関係は強い
      } else if (item.type.startsWith('chronological_')) {
        strength = 80; // 時系列も強い
      }

      relationships.push({
        sourceTerm: q.term,
        targetTerm: item.term,
        strength,
        relationType: item.type,
      });

      // 双方向の関連も追加（逆向き）
      let reverseType: RelationType = 'related';
      if (item.type === 'cause') {
        reverseType = 'effect';
      } else if (item.type === 'effect') {
        reverseType = 'cause';
      } else if (item.type === 'chronological_before') {
        reverseType = 'chronological_after';
      } else if (item.type === 'chronological_after') {
        reverseType = 'chronological_before';
      } else {
        reverseType = item.type;
      }

      relationships.push({
        sourceTerm: item.term,
        targetTerm: q.term,
        strength,
        relationType: reverseType,
      });
    }
  }

  // 年代から時系列関連を自動生成
  const chronologicalRelations = generateChronologicalRelations(questions, 50);
  relationships.push(...chronologicalRelations);

  return relationships;
}

// ===== メイン処理 =====

function main() {
  console.log('📚 社会科CSV→JSON変換スクリプト');
  console.log('');

  // CSVファイルを検索
  const dataPacksDir = path.join(__dirname, '../local-data-packs');
  const csvFiles = fs
    .readdirSync(dataPacksDir)
    .filter((f: string) => f.startsWith('social-studies') && f.endsWith('.csv'));

  if (csvFiles.length === 0) {
    console.error('❌ CSVファイルが見つかりません');
    process.exit(1);
  }

  console.log(`📁 ${csvFiles.length}個のCSVファイルを検出`);
  console.log('');

  for (const csvFile of csvFiles) {
    const csvPath = path.join(dataPacksDir, csvFile);
    const baseName = path.basename(csvFile, '.csv');

    console.log(`⚙️ 変換中: ${csvFile}`);

    try {
      // CSV読み込み
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const rows = parseCSV(csvContent);

      console.log(`   📖 ${rows.length}問を読み込みました`);

      // JSON変換
      const questions = rows.map((row) => convertCSVRow(row));

      // 関連情報抽出
      const relationships = extractRelationships(questions);

      console.log(`   🔗 ${relationships.length}個の関連を抽出しました`);

      // JSONファイル出力
      const outputDir = path.join(__dirname, '../public/data/social-studies');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const questionOutputPath = path.join(outputDir, `${baseName}.json`);
      const relationshipOutputPath = path.join(outputDir, `${baseName}-relationships.json`);

      fs.writeFileSync(questionOutputPath, JSON.stringify(questions, null, 2), 'utf-8');
      fs.writeFileSync(relationshipOutputPath, JSON.stringify(relationships, null, 2), 'utf-8');

      console.log(`   ✅ 出力: ${baseName}.json`);
      console.log(`   ✅ 出力: ${baseName}-relationships.json`);
      console.log('');
    } catch (error) {
      console.error(`   ❌ エラー: ${error}`);
      console.log('');
    }
  }

  console.log('🎉 変換完了！');
}

// 実行
main();
