#!/usr/bin/env node

/**
 * 危険パターン検出スクリプト
 * 
 * AIが編集しようとしているファイルに対して、
 * 過去の失敗パターンとホットスポットを照合し、
 * リスクスコアを計算して警告を表示
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const FAILURE_PATTERNS_PATH = path.join(ROOT, '.aitk/failure-patterns.json');

/**
 * failure-patterns.jsonを読み込み
 */
function loadFailurePatterns() {
  if (!fs.existsSync(FAILURE_PATTERNS_PATH)) {
    console.error('❌ failure-patterns.jsonが見つかりません');
    process.exit(1);
  }
  
  const content = fs.readFileSync(FAILURE_PATTERNS_PATH, 'utf-8');
  return JSON.parse(content);
}

/**
 * ファイルがホットスポットかチェック
 */
function isHotspot(file, hotspots) {
  return hotspots.find(h => h.file === file);
}

/**
 * ファイルの差分から危険パターンを検出
 */
function detectPatternInDiff(file, patterns) {
  try {
    // git diffでファイルの変更内容を取得（staged + unstaged）
    const diff = execSync(`git diff HEAD ${file} 2>/dev/null || git diff --cached ${file} 2>/dev/null || echo ""`, {
      encoding: 'utf-8',
      cwd: ROOT
    });
    
    const detectedPatterns = [];
    
    Object.values(patterns).forEach(pattern => {
      // パターンごとの検出ロジック
      if (pattern.detectionPattern && pattern.detectionPattern.files) {
        const fileMatches = pattern.detectionPattern.files.some(glob => {
          // 簡易的なglobマッチング
          const regex = new RegExp(glob.replace('**/', '.*').replace('*', '[^/]*').replace('.', '\\.'));
          return regex.test(file);
        });
        
        if (fileMatches) {
          // プロパティ名変更の検出
          if (pattern.category === 'type-error') {
            const propertyChangeRegex = /[-+]\s*\w+\.\w+/g;
            const matches = diff.match(propertyChangeRegex);
            if (matches && matches.length > 0) {
              detectedPatterns.push({
                pattern,
                confidence: 0.7,
                evidence: `プロパティアクセスの変更を検出: ${matches.slice(0, 3).join(', ')}`
              });
            }
          }
          
          // リファクタリングの検出
          if (pattern.category === 'logic-error') {
            const refactoringKeywords = ['refactor', 'リファクタリング', '整理', '統一'];
            const hasRefactoringKeyword = refactoringKeywords.some(kw => diff.toLowerCase().includes(kw));
            const hasLogicChange = diff.includes('if (') || diff.includes('switch') || diff.includes('case');
            
            if (hasRefactoringKeyword && hasLogicChange) {
              detectedPatterns.push({
                pattern,
                confidence: 0.6,
                evidence: 'リファクタリング中のロジック変更を検出'
              });
            }
          }
        }
      }
    });
    
    return detectedPatterns;
  } catch (error) {
    // git diffが失敗した場合（新規ファイル等）
    return [];
  }
}

/**
 * ファイルのリスクスコアを計算
 */
function calculateRiskScore(file, db) {
  let score = 0;
  const reasons = [];
  const warnings = [];
  
  // 1. ホットスポットチェック（最大40点）
  const hotspot = isHotspot(file, db.hotspots || []);
  if (hotspot) {
    const hotspotScore = Math.min(40, hotspot.count * 2);
    score += hotspotScore;
    reasons.push(`ホットスポット（${hotspot.count}回修正）: +${hotspotScore}点`);
    
    if (hotspot.count > 20) {
      warnings.push({
        level: 'critical',
        message: `このファイルは過去${hotspot.count}回修正されています（超高リスク）`,
        recommendation: [
          '変更前に必ずテストを実行',
          '小さな変更に分割することを推奨',
          'レビュー必須'
        ]
      });
    } else if (hotspot.count > 10) {
      warnings.push({
        level: 'high',
        message: `このファイルは過去${hotspot.count}回修正されています（高リスク）`,
        recommendation: [
          '慎重に変更してください',
          'テスト実行を推奨'
        ]
      });
    }
  }
  
  // 2. 危険パターン検出（最大60点）
  const detectedPatterns = detectPatternInDiff(file, db.failurePatterns);
  detectedPatterns.forEach(({ pattern, confidence, evidence }) => {
    const patternScore = Math.floor(pattern.weight * 30 * confidence);
    score += patternScore;
    reasons.push(`${pattern.description} (信頼度: ${Math.floor(confidence * 100)}%): +${patternScore}点`);
    
    const successRatePercent = Math.floor((pattern.learningMetrics?.successRate || 0) * 100);
    
    warnings.push({
      level: pattern.severity,
      message: `過去の失敗パターンを検出: ${pattern.description}`,
      stats: {
        occurrences: pattern.occurrences,
        successRate: successRatePercent,
        evidence
      },
      recommendation: pattern.prevention ? [
        `チェック: ${pattern.prevention.command || '型チェック必須'}`,
        pattern.prevention.instructionsFile ? `参照: ${pattern.prevention.instructionsFile}` : null
      ].filter(Boolean) : []
    });
  });
  
  return {
    file,
    score: Math.min(100, score),
    level: score >= 70 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low',
    reasons,
    warnings
  };
}

/**
 * リスク評価結果を表示
 */
function displayRiskAssessment(risks) {
  console.log('\n📊 ファイルリスク評価\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (risks.length === 0) {
    console.log('✅ 検出されたリスクはありません\n');
    return;
  }
  
  // リスクスコア順にソート
  risks.sort((a, b) => b.score - a.score);
  
  risks.forEach((risk, index) => {
    const icon = risk.level === 'critical' ? '🔴' : 
                 risk.level === 'high' ? '🟠' : 
                 risk.level === 'medium' ? '🟡' : '🟢';
    
    console.log(`${icon} ${risk.file}`);
    console.log(`   リスクスコア: ${risk.score}/100 (${risk.level.toUpperCase()})\n`);
    
    if (risk.reasons.length > 0) {
      console.log('   理由:');
      risk.reasons.forEach(reason => {
        console.log(`     • ${reason}`);
      });
      console.log('');
    }
    
    if (risk.warnings.length > 0) {
      console.log('   ⚠️  警告:');
      risk.warnings.forEach(warning => {
        console.log(`     ${warning.message}`);
        
        if (warning.stats) {
          console.log(`       - 過去の発生回数: ${warning.stats.occurrences}回`);
          console.log(`       - 成功率: ${warning.stats.successRate}%`);
          if (warning.stats.evidence) {
            console.log(`       - 検出内容: ${warning.stats.evidence}`);
          }
        }
        
        if (warning.recommendation && warning.recommendation.length > 0) {
          console.log('       推奨アクション:');
          warning.recommendation.forEach(rec => {
            console.log(`         → ${rec}`);
          });
        }
        console.log('');
      });
    }
    
    if (index < risks.length - 1) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  });
  
  // サマリー
  const criticalCount = risks.filter(r => r.level === 'critical').length;
  const highCount = risks.filter(r => r.level === 'high').length;
  
  if (criticalCount > 0 || highCount > 0) {
    console.log('\n⚠️  総合評価:');
    if (criticalCount > 0) {
      console.log(`   🔴 超高リスク: ${criticalCount}ファイル`);
    }
    if (highCount > 0) {
      console.log(`   🟠 高リスク: ${highCount}ファイル`);
    }
    console.log('\n   推奨: 変更前に必ずテストを実行してください');
    console.log('        npm run type-check && npm run test:unit\n');
  }
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使い方: node scripts/detect-dangerous-patterns.mjs <files...>');
    console.log('例: node scripts/detect-dangerous-patterns.mjs src/ai/specialists/MemoryAI.ts');
    process.exit(1);
  }
  
  // failure-patterns.json読み込み
  const db = loadFailurePatterns();
  
  // 各ファイルのリスク評価
  const risks = [];
  
  for (const file of args) {
    const normalizedFile = file.replace(/^\//, '').replace(ROOT + '/', '');
    
    // ファイルが存在するかチェック
    const fullPath = path.join(ROOT, normalizedFile);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  ファイルが見つかりません: ${normalizedFile}`);
      continue;
    }
    
    const riskAssessment = calculateRiskScore(normalizedFile, db);
    
    if (riskAssessment.score > 0) {
      risks.push(riskAssessment);
    }
  }
  
  // 結果表示
  displayRiskAssessment(risks);
  
  // 超高リスクがある場合は終了コード1
  const hasCriticalRisk = risks.some(r => r.level === 'critical');
  if (hasCriticalRisk) {
    console.log('❌ 超高リスクのファイルが検出されました');
    console.log('   このまま続行する場合は注意してください\n');
    // 注意: コミットはブロックしない（警告のみ）
    // process.exit(1);
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ エラー:', error.message);
  process.exit(1);
});
