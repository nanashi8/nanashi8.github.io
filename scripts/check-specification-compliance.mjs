#!/usr/bin/env node

/**
 * 仕様書遵守チェッカー
 * 
 * 目的: AIが勝手に仕様を変更していないかチェック
 * 
 * チェック項目:
 * 1. 音声速度の変更（0.85固定）
 * 2. CSS変数の値変更
 * 3. 「調整済み」コメントがある設定値の変更
 */

import fs from 'fs';
import { execSync } from 'child_process';

// 色付きログ
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

console.log(`${colors.blue}🔍 仕様書遵守チェック開始...${colors.reset}`);

let hasViolations = false;

// 変更されたファイルを取得
let changedFiles;
try {
  changedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
    .split('\n')
    .filter(Boolean);
} catch (error) {
  console.log(`${colors.yellow}⚠️  Git差分の取得に失敗しました${colors.reset}`);
  process.exit(0);
}

// 仕様チェック1: 音声速度（0.85固定）
if (changedFiles.includes('src/features/speech/speechSynthesis.ts')) {
  console.log(`${colors.blue}📢 音声設定ファイルの変更を検出${colors.reset}`);
  
  try {
    const diff = execSync('git diff --cached src/features/speech/speechSynthesis.ts', {
      encoding: 'utf-8',
    });
    
    // 速度の変更を検出
    const speedChangePattern = /[-+].*utterance\.rate.*=.*(?:parseFloat\(savedRate\)\s*:\s*)?(0\.\d+)/g;
    const matches = [...diff.matchAll(speedChangePattern)];
    
    const removedSpeeds = [];
    const addedSpeeds = [];
    
    matches.forEach(match => {
      const line = match[0];
      const speed = match[1];
      
      if (line.startsWith('-')) {
        removedSpeeds.push(speed);
      } else if (line.startsWith('+')) {
        addedSpeeds.push(speed);
      }
    });
    
    // 0.85から別の値に変更されている場合
    if (removedSpeeds.includes('0.85') && addedSpeeds.length > 0 && !addedSpeeds.includes('0.85')) {
      console.log(`${colors.red}❌ 音声速度の変更を検出しました${colors.reset}`);
      console.log(`${colors.yellow}   変更前: 0.85 → 変更後: ${addedSpeeds.join(', ')}${colors.reset}`);
      console.log('');
      console.log(`${colors.red}🚨 仕様違反: 音声速度0.85は高校受験用に調整済みです${colors.reset}`);
      console.log('');
      console.log('📋 この値は以下の理由により固定されています:');
      console.log('   - 高校生の英語学習に最適な速度');
      console.log('   - 聞き取りやすさと自然さのバランス');
      console.log('   - ユーザーの明示的な指示でのみ変更可能');
      console.log('');
      console.log('💡 対応方法:');
      console.log('   1. 速度以外の方法で改善する（音声エンジンの選択等）');
      console.log('   2. ユーザーに速度変更の許可を求める');
      console.log('   3. 速度を0.85に戻す');
      console.log('');
      console.log('📚 参照ドキュメント:');
      console.log('   - .ai-instructions/SPECIFICATION_ENFORCEMENT.md');
      console.log('');
      hasViolations = true;
    }
  } catch (error) {
    // 差分取得エラーは無視
  }
}

// 仕様チェック2: CSS変数の値変更
const cssFiles = changedFiles.filter(f => f.includes('variables.css'));
if (cssFiles.length > 0) {
  console.log(`${colors.blue}🎨 CSS変数ファイルの変更を検出${colors.reset}`);
  
  try {
    const diff = execSync(`git diff --cached ${cssFiles.join(' ')}`, {
      encoding: 'utf-8',
    });
    
    // CSS変数の値変更を検出（コメントに「調整済み」等がある場合）
    const adjustedVarPattern = /[-+]\s*--[\w-]+:\s*[^;]+;\s*\/\*.*(?:調整済み|最適化済み|固定値)/g;
    const matches = [...diff.matchAll(adjustedVarPattern)];
    
    if (matches.length > 0) {
      console.log(`${colors.red}❌ 調整済みCSS変数の変更を検出しました${colors.reset}`);
      console.log('');
      console.log(`${colors.yellow}変更された変数:${colors.reset}`);
      matches.forEach(match => {
        console.log(`   ${match[0].replace(/^[-+]\s*/, '').substring(0, 60)}...`);
      });
      console.log('');
      console.log(`${colors.red}🚨 仕様違反: 調整済みの値は変更できません${colors.reset}`);
      console.log('');
      console.log('💡 対応方法:');
      console.log('   1. ユーザーに変更の許可を求める');
      console.log('   2. 変更を元に戻す');
      console.log('');
      hasViolations = true;
    }
  } catch (error) {
    // 差分取得エラーは無視
  }
}

// 仕様チェック3: 「調整済み」コメント付き設定値の変更
const tsFiles = changedFiles.filter(f => f.match(/\.(ts|tsx)$/));
if (tsFiles.length > 0) {
  try {
    const diff = execSync(`git diff --cached ${tsFiles.join(' ')}`, {
      encoding: 'utf-8',
    });
    
    // 「調整済み」等のコメントがある行の変更を検出
    const adjustedValuePattern = /[-+].*(?:調整済み|最適化済み|高校受験用|固定値)/g;
    const matches = [...diff.matchAll(adjustedValuePattern)];
    
    const suspiciousChanges = [];
    matches.forEach(match => {
      const line = match[0];
      if (line.startsWith('+') && !line.includes('調整済み')) {
        // 削除行に「調整済み」があるのに、追加行にはない場合
        suspiciousChanges.push(line);
      }
    });
    
    if (suspiciousChanges.length > 0) {
      console.log(`${colors.yellow}⚠️  調整済み設定の変更の可能性を検出${colors.reset}`);
      console.log('');
      console.log('変更された箇所に「調整済み」コメントがあります。');
      console.log('ユーザーの承認を得ているか確認してください。');
      console.log('');
      console.log('📚 参照: .ai-instructions/SPECIFICATION_ENFORCEMENT.md');
      console.log('');
    }
  } catch (error) {
    // 差分取得エラーは無視
  }
}

// 結果
if (hasViolations) {
  console.log(`${colors.red}❌ 仕様違反が検出されました${colors.reset}`);
  console.log('');
  console.log('🛡️  このプロジェクトでは、既存の仕様（特に調整済みの値）を');
  console.log('   勝手に変更することは禁止されています。');
  console.log('');
  console.log('📖 詳細は以下のドキュメントを参照してください:');
  console.log('   .ai-instructions/SPECIFICATION_ENFORCEMENT.md');
  console.log('   .ai-instructions/CRITICAL_RULES.md');
  console.log('');
  console.log('⛔ --no-verify でのバイパスは推奨されません');
  console.log('');
  process.exit(1);
} else {
  console.log(`${colors.green}✅ 仕様遵守チェック完了${colors.reset}`);
  console.log('');
}
