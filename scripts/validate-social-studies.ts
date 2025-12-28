#!/usr/bin/env tsx

/**
 * 社会科教材CSVファイルの品質検証スクリプト
 *
 * 用途：
 * - CSVフォーマットの検証
 * - 必須列の存在確認
 * - 年代形式の検証（歴史のみ必須）
 * - 難易度値の妥当性確認
 * - 重複チェック
 * - 関連分野の一貫性確認
 * - 読み仮名の妥当性確認
 *
 * 使用例：
 * npx tsx scripts/validate-social-studies.ts local-data-packs/social-studies-sample.csv
 * npx tsx scripts/validate-social-studies.ts local-data-packs/social-studies-sample.csv --verbose
 * npx tsx scripts/validate-social-studies.ts local-data-packs/social-studies-sample.csv --output report.json
 */

import * as fs from 'fs';
import * as path from 'path';

// ===== 型定義 =====

interface SocialStudiesRow {
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

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  line: number;
  field: string;
  message: string;
  value?: string;
}

interface ValidationReport {
  filePath: string;
  totalRows: number;
  validRows: number;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  qualityScore: number; // 0-100
  passed: boolean; // 80点以上でtrue
}

// ===== 定数 =====

const REQUIRED_COLUMNS = [
  '語句',
  '読み',
  '事項',
  '問題文',
  '説明',
  '関連事項',
  '関連分野',
  '難易度',
  'source',
  '年代',
  '選択肢生成ヒント'
];

const VALID_DIFFICULTIES = ['1', '2', '3', '4', '5'];

const VALID_RELATED_FIELDS = [
  '歴史-古代',
  '歴史-中世',
  '歴史-近世',
  '歴史-近代',
  '歴史-現代',
  '地理-日本',
  '地理-世界',
  '地理-産業',
  '地理-環境',
  '公民-政治',
  '公民-経済',
  '公民-国際',
  '公民-人権'
];

const HIRAGANA_REGEX = /^[ぁ-んー、。]+$/;
const YEAR_REGEX = /^\d{4}$/;

// ===== 検証関数 =====

/**
 * CSVファイルを解析して行配列に変換
 */
function parseCSV(content: string): SocialStudiesRow[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSVファイルが空または不正です（ヘッダー行とデータ行が必要）');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const rows: SocialStudiesRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row as SocialStudiesRow);
  }

  return rows;
}

/**
 * ヘッダー検証
 */
function validateHeaders(content: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lines = content.trim().split('\n');

  if (lines.length === 0) {
    issues.push({
      severity: 'error',
      line: 0,
      field: 'header',
      message: 'CSVファイルが空です'
    });
    return issues;
  }

  const headers = lines[0].split(',').map(h => h.trim());

  // 必須列の存在確認
  REQUIRED_COLUMNS.forEach(col => {
    if (!headers.includes(col)) {
      issues.push({
        severity: 'error',
        line: 1,
        field: 'header',
        message: `必須列「${col}」が見つかりません`
      });
    }
  });

  // 列順の確認（推奨）
  REQUIRED_COLUMNS.forEach((col, index) => {
    if (headers[index] !== col) {
      issues.push({
        severity: 'warning',
        line: 1,
        field: 'header',
        message: `列の順序が推奨と異なります。期待: ${col}, 実際: ${headers[index] || '(なし)'}`
      });
    }
  });

  return issues;
}

/**
 * 行データの検証
 */
function validateRow(row: SocialStudiesRow, lineNumber: number, allRows: SocialStudiesRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. 必須フィールドの存在確認
  if (!row.語句 || row.語句.trim() === '') {
    issues.push({
      severity: 'error',
      line: lineNumber,
      field: '語句',
      message: '語句が空です'
    });
  }

  if (!row.問題文 || row.問題文.trim() === '') {
    issues.push({
      severity: 'error',
      line: lineNumber,
      field: '問題文',
      message: '問題文が空です'
    });
  }

  if (!row.説明 || row.説明.trim() === '') {
    issues.push({
      severity: 'error',
      line: lineNumber,
      field: '説明',
      message: '説明が空です'
    });
  }

  // 2. 読み仮名の検証
  if (row.読み && row.読み.trim() !== '') {
    if (!HIRAGANA_REGEX.test(row.読み)) {
      issues.push({
        severity: 'warning',
        line: lineNumber,
        field: '読み',
        message: '読み仮名にひらがな以外の文字が含まれています',
        value: row.読み
      });
    }
  } else {
    issues.push({
      severity: 'warning',
      line: lineNumber,
      field: '読み',
      message: '読み仮名が空です'
    });
  }

  // 3. 難易度の検証
  if (!VALID_DIFFICULTIES.includes(row.難易度)) {
    issues.push({
      severity: 'error',
      line: lineNumber,
      field: '難易度',
      message: `難易度は1-5の整数である必要があります`,
      value: row.難易度
    });
  }

  // 4. 関連分野の検証
  if (row.関連分野 && row.関連分野.trim() !== '') {
    const fields = row.関連分野.split('|').map(f => f.trim());
    fields.forEach(field => {
      if (!VALID_RELATED_FIELDS.includes(field)) {
        issues.push({
          severity: 'warning',
          line: lineNumber,
          field: '関連分野',
          message: `不明な関連分野: ${field}（有効な値: ${VALID_RELATED_FIELDS.join(', ')}）`,
          value: field
        });
      }
    });

    // 歴史分野の場合、年代が必須
    const isHistory = fields.some(f => f.startsWith('歴史-'));
    if (isHistory) {
      if (!row.年代 || row.年代.trim() === '') {
        issues.push({
          severity: 'error',
          line: lineNumber,
          field: '年代',
          message: '歴史分野の問題には年代（4桁西暦）が必須です'
        });
      } else if (!YEAR_REGEX.test(row.年代)) {
        issues.push({
          severity: 'error',
          line: lineNumber,
          field: '年代',
          message: '年代は4桁の西暦である必要があります',
          value: row.年代
        });
      } else {
        // 年代の妥当性チェック（極端な値の検出）
        const year = parseInt(row.年代, 10);
        if (year < 500 || year > 2100) {
          issues.push({
            severity: 'warning',
            line: lineNumber,
            field: '年代',
            message: '年代が極端な値です。確認してください',
            value: row.年代
          });
        }
      }
    }
  } else {
    issues.push({
      severity: 'error',
      line: lineNumber,
      field: '関連分野',
      message: '関連分野が空です'
    });
  }

  // 5. 問題文の品質チェック
  if (row.問題文.length < 10) {
    issues.push({
      severity: 'warning',
      line: lineNumber,
      field: '問題文',
      message: '問題文が短すぎる可能性があります（10文字未満）',
      value: row.問題文
    });
  }

  if (!row.問題文.includes('？') && !row.問題文.includes('?')) {
    issues.push({
      severity: 'info',
      line: lineNumber,
      field: '問題文',
      message: '問題文に疑問符（？）が含まれていません'
    });
  }

  // 6. 説明文の品質チェック
  if (row.説明.length < 20) {
    issues.push({
      severity: 'warning',
      line: lineNumber,
      field: '説明',
      message: '説明が短すぎる可能性があります（20文字未満）',
      value: row.説明
    });
  }

  // 7. 語句の重複チェック
  const duplicates = allRows.filter(r => r.語句 === row.語句);
  if (duplicates.length > 1) {
    issues.push({
      severity: 'warning',
      line: lineNumber,
      field: '語句',
      message: `語句「${row.語句}」が重複しています（${duplicates.length}件）`
    });
  }

  // 8. 選択肢生成ヒントの検証
  if (row.選択肢生成ヒント && row.選択肢生成ヒント.trim() !== '') {
    const hints = row.選択肢生成ヒント.split('|').map(h => h.trim());
    if (hints.length < 2) {
      issues.push({
        severity: 'info',
        line: lineNumber,
        field: '選択肢生成ヒント',
        message: '選択肢生成ヒントは2つ以上推奨です（|区切り）'
      });
    }
  }

  // 9. 語句と説明の整合性チェック（語句が説明に含まれているか）
  if (!row.説明.includes(row.語句)) {
    issues.push({
      severity: 'info',
      line: lineNumber,
      field: '説明',
      message: `説明に語句「${row.語句}」が含まれていません（確認推奨）`
    });
  }

  return issues;
}

/**
 * 品質スコアの計算（100点満点）
 */
function calculateQualityScore(report: ValidationReport): number {
  const { errors, warnings, infos } = report.summary;
  const totalRows = report.totalRows;

  if (totalRows === 0) return 0;

  // エラー: -10点/件
  // 警告: -3点/件
  // 情報: -1点/件
  let score = 100;
  score -= errors * 10;
  score -= warnings * 3;
  score -= infos * 1;

  return Math.max(0, score);
}

/**
 * 検証実行
 */
function validateFile(filePath: string, strict: boolean = false): ValidationReport {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues: ValidationIssue[] = [];

  // ヘッダー検証
  const headerIssues = validateHeaders(content);
  issues.push(...headerIssues);

  // ヘッダーにエラーがある場合は処理中断
  const criticalHeaderError = headerIssues.some(i => i.severity === 'error');
  if (criticalHeaderError) {
    return {
      filePath,
      totalRows: 0,
      validRows: 0,
      issues,
      summary: {
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        infos: issues.filter(i => i.severity === 'info').length
      },
      qualityScore: 0,
      passed: false
    };
  }

  // 行データの解析と検証
  const rows = parseCSV(content);
  let validRows = 0;

  rows.forEach((row, index) => {
    const lineNumber = index + 2; // ヘッダー行が1行目
    const rowIssues = validateRow(row, lineNumber, rows);
    issues.push(...rowIssues);

    if (rowIssues.filter(i => i.severity === 'error').length === 0) {
      validRows++;
    }
  });

  const summary = {
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    infos: issues.filter(i => i.severity === 'info').length
  };

  const report: ValidationReport = {
    filePath,
    totalRows: rows.length,
    validRows,
    issues,
    summary,
    qualityScore: 0,
    passed: false
  };

  report.qualityScore = calculateQualityScore(report);
  report.passed = report.qualityScore >= 80 && summary.errors === 0;

  return report;
}

/**
 * レポートの表示
 */
function displayReport(report: ValidationReport, verbose: boolean = false): void {
  console.log('==========================================');
  console.log('社会科教材品質検証レポート');
  console.log('==========================================');
  console.log('');
  console.log(`ファイル: ${report.filePath}`);
  console.log(`総行数: ${report.totalRows}`);
  console.log(`有効行数: ${report.validRows}`);
  console.log('');
  console.log('問題サマリー:');
  console.log(`  エラー: ${report.summary.errors}`);
  console.log(`  警告: ${report.summary.warnings}`);
  console.log(`  情報: ${report.summary.infos}`);
  console.log('');
  console.log(`品質スコア: ${report.qualityScore}/100`);
  console.log(`判定: ${report.passed ? '✅ 合格（80点以上）' : '❌ 不合格（80点未満またはエラーあり）'}`);
  console.log('');

  if (report.issues.length > 0) {
    console.log('詳細:');
    console.log('------------------------------------------');

    // エラーを優先表示
    const errors = report.issues.filter(i => i.severity === 'error');
    const warnings = report.issues.filter(i => i.severity === 'warning');
    const infos = report.issues.filter(i => i.severity === 'info');

    if (errors.length > 0) {
      console.log('\n🔴 エラー:');
      errors.forEach(issue => {
        console.log(`  [行${issue.line}] ${issue.field}: ${issue.message}`);
        if (issue.value && verbose) {
          console.log(`    値: "${issue.value}"`);
        }
      });
    }

    if (warnings.length > 0) {
      console.log('\n🟡 警告:');
      warnings.forEach(issue => {
        console.log(`  [行${issue.line}] ${issue.field}: ${issue.message}`);
        if (issue.value && verbose) {
          console.log(`    値: "${issue.value}"`);
        }
      });
    }

    if (infos.length > 0 && verbose) {
      console.log('\nℹ️ 情報:');
      infos.forEach(issue => {
        console.log(`  [行${issue.line}] ${issue.field}: ${issue.message}`);
        if (issue.value) {
          console.log(`    値: "${issue.value}"`);
        }
      });
    }
  } else {
    console.log('✅ 問題は見つかりませんでした！');
  }

  console.log('');
  console.log('==========================================');
}

// ===== メイン処理 =====

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
使用方法:
  npx tsx scripts/validate-social-studies.ts <ファイルパス> [オプション]

オプション:
  --strict          厳格モード（警告もエラーとして扱う）
  --output <path>   JSON形式でレポートを出力
  --verbose, -v     詳細表示（情報レベルの問題も表示）
  --help, -h        このヘルプを表示

例:
  npx tsx scripts/validate-social-studies.ts local-data-packs/social-studies-sample.csv
  npx tsx scripts/validate-social-studies.ts local-data-packs/social-studies-sample.csv --verbose
  npx tsx scripts/validate-social-studies.ts local-data-packs/social-studies-sample.csv --output report.json
`);
    process.exit(0);
  }

  const filePath = args[0];
  const strict = args.includes('--strict');
  const verbose = args.includes('--verbose') || args.includes('-v');
  const outputIndex = args.indexOf('--output');
  const outputPath = outputIndex !== -1 && args[outputIndex + 1] ? args[outputIndex + 1] : null;

  if (!fs.existsSync(filePath)) {
    console.error(`エラー: ファイルが見つかりません: ${filePath}`);
    process.exit(1);
  }

  try {
    const report = validateFile(filePath, strict);
    displayReport(report, verbose);

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      console.log(`レポートを出力しました: ${outputPath}`);
    }

    // 終了コード（CIで使用可能）
    if (!report.passed) {
      process.exit(1);
    }
  } catch (error) {
    console.error('検証エラー:', error);
    process.exit(1);
  }
}

// ES module対応
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}

export { validateFile, ValidationReport, ValidationIssue };
