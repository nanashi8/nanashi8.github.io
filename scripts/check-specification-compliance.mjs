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

// UIレイアウト変更のユーザー承認ログ（同一コミットに含める）
const UI_APPROVAL_LOG_PATH = '.ai-instructions/UI_CHANGE_APPROVALS.md';

function isUILayoutChangeApproved(layoutFiles) {
  try {
    // 承認ログがステージされていることを必須条件にする（後付け承認を防ぐ）
    const staged = execSync(`git diff --cached --name-only ${UI_APPROVAL_LOG_PATH}`, {
      encoding: 'utf-8',
    })
      .split('\n')
      .filter(Boolean);
    if (staged.length === 0) return false;

    if (!fs.existsSync(UI_APPROVAL_LOG_PATH)) return false;
    const content = fs.readFileSync(UI_APPROVAL_LOG_PATH, 'utf-8');
    if (!content.includes('承認: OK')) return false;

    // 承認ログに対象ファイルが明記されていること
    return layoutFiles.some(f => content.includes(f));
  } catch {
    return false;
  }
}

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

// 仕様チェック4: レイアウトの無断変更を検出
const layoutFiles = changedFiles.filter(f => f.match(/\.(tsx|jsx|html|css)$/));
if (layoutFiles.length > 0) {
  console.log(`${colors.blue}📐 レイアウトファイルの変更を検出${colors.reset}`);

  try {
    const diff = execSync(`git diff --cached ${layoutFiles.join(' ')}`, {
      encoding: 'utf-8',
    });

    // レイアウト関連のクラス/プロパティの変更を検出
    const layoutPatterns = [
      // Flexbox/Grid レイアウト
      /[-+].*className=["'][^"']*\b(flex|grid|inline-flex|inline-grid)\b/,
      /[-+].*\b(flex-row|flex-col|flex-wrap|grid-cols|grid-rows|gap-\d+)\b/,
      /[-+].*\b(justify-|items-|content-|place-)(start|end|center|between|around|evenly|stretch)/,

      // Positioning
      /[-+].*\b(relative|absolute|fixed|sticky)\b/,
      /[-+].*\b(top-|right-|bottom-|left-|inset-)\d+/,
      /[-+].*\b(z-\d+)\b/,

      // Spacing (大幅な変更のみ)
      /[-+].*\b(m|p|space)-(x|y|t|r|b|l|s|e)-(\d{2,}|auto)\b/,

      // Width/Height (大幅な変更のみ)
      /[-+].*\b(w|h|min-w|min-h|max-w|max-h)-(full|screen|1\/\d+|auto|\d{2,})\b/,

      // Display
      /[-+].*\b(block|inline-block|inline|hidden)\b/,

      // CSS display/position/layout properties
      /[-+].*\b(display|position|float|clear):\s*\w+/,
    ];

    let layoutChanges = [];
    const diffLines = diff.split('\n');

    diffLines.forEach((line, index) => {
      // 削除行または追加行のみチェック
      if (!line.startsWith('-') && !line.startsWith('+')) return;
      if (line.startsWith('---') || line.startsWith('+++')) return;

      layoutPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          // コンテキストを含める（前後の行）
          const context = diffLines.slice(Math.max(0, index - 1), index + 2).join('\n');
          layoutChanges.push({
            line: line.substring(0, 80),
            context: context
          });
        }
      });
    });

    // 重複除去
    layoutChanges = layoutChanges.filter((change, index, self) =>
      index === self.findIndex(c => c.line === change.line)
    );

    if (layoutChanges.length > 0) {
      const approved = isUILayoutChangeApproved(layoutFiles);
      if (approved) {
        console.log(`${colors.yellow}⚠️  レイアウト変更を検出しました（ユーザー承認済み）${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ レイアウト変更を検出しました${colors.reset}`);
      }
      console.log('');
      console.log(`${colors.yellow}検出された変更: ${layoutChanges.length}箇所${colors.reset}`);
      console.log('');

      // 最初の3件のみ表示
      layoutChanges.slice(0, 3).forEach((change, i) => {
        console.log(`${i + 1}. ${change.line.trim()}`);
      });

      if (layoutChanges.length > 3) {
        console.log(`   ... 他 ${layoutChanges.length - 3}件`);
      }

      console.log('');
      if (approved) {
        console.log(`${colors.yellow}📌 この変更はユーザー指示に基づくため継続します${colors.reset}`);
        console.log(`${colors.yellow}   承認ログ: ${UI_APPROVAL_LOG_PATH}${colors.reset}`);
        console.log('');
      } else {
        console.log(`${colors.red}🚨 仕様違反: レイアウトの無断変更は禁止されています${colors.reset}`);
      }
      console.log('');
      console.log('📋 レイアウト変更が禁止される理由:');
      console.log('   - 既存のUIはユーザー体験のため調整済み');
      console.log('   - 無断の最適化は意図しない副作用を引き起こす');
      console.log('   - レスポンシブ対応に影響を与える可能性');
      console.log('');
      console.log('💡 対応方法:');
      console.log('   1. ユーザーに「レイアウトを変更してもよいか」明確に確認');
      console.log('   2. 変更理由とbefore/afterを説明して承認を得る');
      console.log('   3. 承認なしに変更した場合は元に戻す');
      console.log('');
      console.log('✅ 許可される場合:');
      console.log('   - ユーザーが「レイアウトを改善して」と明示的に依頼');
      console.log('   - ユーザーが具体的な変更内容を指示');
      console.log('   - 新規作成のコンポーネント（既存の影響なし）');
      console.log('');
      console.log('📚 参照ドキュメント:');
      console.log('   - .ai-instructions/SPECIFICATION_ENFORCEMENT.md');
      console.log('');
      if (!approved) {
        hasViolations = true;
      }
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
