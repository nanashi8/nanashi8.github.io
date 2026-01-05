#!/usr/bin/env tsx
/**
 * 社会科CSVデータに学年情報を追加するスクリプト
 * 
 * 東京書籍の中学社会カリキュラムに基づいて学年を割り当て：
 * - 1年: 地理（世界・日本基礎）+ 歴史（古代〜平安）
 * - 2年: 地理（日本詳細）+ 歴史（鎌倉〜江戸）
 * - 3年: 歴史（明治〜現代）+ 公民（全範囲）
 */

import * as fs from 'fs';
import * as path from 'path';

interface SocialStudiesRow {
  語句: string;
  読み: string;
  意味: string;
  詳細解説: string;
  関連事項: string;
  関連分野: string;
  種別: string;
  source: string;
  grade?: string; // 新規追加（推奨: '1|2' 形式）
}

function determineGrade(relatedField: string): string {
  const field = relatedField.trim();
  
  // 歴史の時代区分
  if (field.includes('歴史-古代')) return '1';
  if (field.includes('歴史-中世')) return '2';
  if (field.includes('歴史-近世')) return '2';
  if (field.includes('歴史-近代')) return '3';
  if (field.includes('歴史-現代')) return '3';
  
  // 地理の区分
  if (field.includes('地理-世界')) return '1';
  if (field.includes('地理-日本')) return '1|2'; // 1-2年で扱う
  if (field.includes('地理-産業')) return '2';
  if (field.includes('地理-環境')) return '2';
  
  // 公民は全て3年
  if (field.includes('公民')) return '3';
  
  // デフォルト（関連分野が不明な場合は全学年）
  return '1|2|3';
}

function parseCSV(csvText: string): SocialStudiesRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: any = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    return row as SocialStudiesRow;
  });
}

function formatCSV(rows: SocialStudiesRow[]): string {
  const headers = ['語句', '読み', '意味', '詳細解説', '関連事項', '関連分野', '種別', 'source', 'grade'];
  const csvLines = [headers.join(',')];
  
  rows.forEach(row => {
    const values = [
      row.語句,
      row.読み,
      row.意味,
      row.詳細解説,
      row.関連事項,
      row.関連分野,
      row.種別,
      row.source,
      row.grade || determineGrade(row.関連分野)
    ];
    csvLines.push(values.join(','));
  });
  
  return csvLines.join('\n');
}

async function main() {
  const csvFiles = [
    'public/data/social-studies/all-social-studies.csv',
    'public/data/social-studies/social-studies-history-40.csv',
    'public/data/social-studies/social-studies-geography-30.csv',
    'public/data/social-studies/social-studies-civics-30.csv',
    'public/data/social-studies/social-studies-sample.csv',
  ];
  
  for (const filePath of csvFiles) {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  スキップ: ${filePath} (ファイルが存在しません)`);
      continue;
    }
    
    console.log(`📝 処理中: ${filePath}`);
    
    const csvText = fs.readFileSync(fullPath, 'utf-8');
    const rows = parseCSV(csvText);
    
    // 学年情報を追加
    rows.forEach(row => {
      if (!row.grade) {
        row.grade = determineGrade(row.関連分野);
      }
    });
    
    // バックアップを作成
    const backupPath = fullPath.replace('.csv', '.backup.csv');
    fs.writeFileSync(backupPath, csvText);
    console.log(`💾 バックアップ: ${backupPath}`);
    
    // 新しいCSVを書き込み
    const newCSV = formatCSV(rows);
    fs.writeFileSync(fullPath, newCSV);
    console.log(`✅ 完了: ${filePath} (${rows.length}行)`);
    
    // 学年別の統計を表示
    const gradeStats: { [key: string]: number } = {};
    rows.forEach(row => {
      const grade = row.grade || '不明';
      gradeStats[grade] = (gradeStats[grade] || 0) + 1;
    });
    console.log('   学年別統計:', gradeStats);
  }
  
  console.log('\n🎉 すべてのファイルの処理が完了しました！');
}

main().catch(err => {
  console.error('❌ エラー:', err);
  process.exit(1);
});
