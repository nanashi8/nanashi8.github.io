/**
 * シミュレーション統合テスト
 *
 * 全ての生徒プロファイルでシミュレーションを実行し、
 * HTML形式で結果を出力します。
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESモジュールで__dirnameを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { allProfiles, validateAllProfiles } from './studentProfiles';
import { runSimulation } from './simulationEngine';
import { generateSimulationHTML, displaySimulationProgress } from './visualizeProgress';

/**
 * メイン実行関数
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  QuestionScheduler シミュレーションテスト                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // プロファイル検証
  console.log('[1/3] 生徒プロファイルを検証中...');
  if (!validateAllProfiles()) {
    console.error('❌ プロファイル検証に失敗しました');
    process.exit(1);
  }
  console.log('✅ 全プロファイルが有効です\n');

  // 出力ディレクトリを作成
  const outputDir = path.join(__dirname, '../../test-results/simulation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  console.log(`📁 出力ディレクトリ: ${outputDir}\n`);

  // 各プロファイルでシミュレーション実行
  console.log('[2/3] シミュレーションを実行中...\n');

  const results = [];

  for (let i = 0; i < allProfiles.length; i++) {
    const profile = allProfiles[i];

    console.log(`\n[${ i + 1}/${allProfiles.length}] ${profile.name} のシミュレーション開始`);
    console.log(`説明: ${profile.description}\n`);

    try {
      const result = await runSimulation(profile, {
        steps: 100, // 見やすく100ステップに調整
        wordListSize: 100,
        onProgress: (snapshot: any) => {
          // ターミナルで進捗表示（10ステップごと）
          if (snapshot.step % 10 === 0) {
            displaySimulationProgress(snapshot, profile.totalWords);
          }
        },
      });

      results.push(result);

      // 個別のHTML結果を生成
      const html = generateSimulationHTML(result);
      const filename = `simulation_${profile.name.toLowerCase().replace(/\s+/g, '_')}.html`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, html, 'utf-8');

      console.log(`\n✅ ${profile.name} のシミュレーション完了`);
      console.log(`   結果: ${filepath}`);

    } catch (error) {
      console.error(`\n❌ ${profile.name} のシミュレーションでエラーが発生しました:`);
      console.error(error);
    }
  }

  // 統合レポートを生成
  console.log('\n[3/3] 統合レポートを生成中...');
  const summaryHTML = generateSummaryHTML(results);
  const summaryPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(summaryPath, summaryHTML, 'utf-8');

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  シミュレーション完了                                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('📊 結果ファイル:');
  console.log(`   統合レポート: ${summaryPath}`);
  results.forEach(result => {
    const filename = `simulation_${result.profile.name.toLowerCase().replace(/\s+/g, '_')}.html`;
    console.log(`   ${result.profile.name}: ${path.join(outputDir, filename)}`);
  });

  console.log('\n💡 ブラウザで統合レポートを開いて結果を確認してください:');
  console.log(`   file://${summaryPath}\n`);
}

/**
 * 統合レポートのHTML生成
 */
function generateSummaryHTML(results: any[]): string {
  const profileCards = results.map(result => {
    const { profile, summary } = result;
    const incorrectChange = summary.categoryChanges.incorrect.change;
    const stillLearningChange = summary.categoryChanges.still_learning.change;
    const masteredChange = summary.categoryChanges.mastered.change;

    const filename = `simulation_${profile.name.toLowerCase().replace(/\s+/g, '_')}.html`;

    return `
      <div class="profile-card">
        <h3>${profile.name}</h3>
        <p class="description">${profile.description}</p>
        <div class="resolution-info" style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 15px 0; font-size: 0.9em;">
          <div style="margin-bottom: 8px;">
            <strong style="color: #ef4444;">まだまだ・覚えていない:</strong> ${summary.categoryChanges.incorrect.start} → ${summary.categoryChanges.incorrect.end}
            <span style="color: #666; margin-left: 8px;">(出題: ${summary.questionsToResolve.incorrect}問)</span>
          </div>
          <div>
            <strong style="color: #f59e0b;">学習中・要復習:</strong> ${summary.categoryChanges.still_learning.start} → ${summary.categoryChanges.still_learning.end}
            <span style="color: #666; margin-left: 8px;">(出題: ${summary.questionsToResolve.still_learning}問)</span>
          </div>
        </div>
        <div class="stats-mini">
          <div class="stat-mini">
            <span class="label">incorrect</span>
            <span class="value ${incorrectChange > 0 ? 'bad' : 'good'}">${incorrectChange > 0 ? '+' : ''}${incorrectChange}</span>
          </div>
          <div class="stat-mini">
            <span class="label">still_learning</span>
            <span class="value ${stillLearningChange > 0 ? 'neutral' : 'good'}">${stillLearningChange > 0 ? '+' : ''}${stillLearningChange}</span>
          </div>
          <div class="stat-mini">
            <span class="label">mastered</span>
            <span class="value ${masteredChange > 0 ? 'good' : 'bad'}">${masteredChange > 0 ? '+' : ''}${masteredChange}</span>
          </div>
        </div>
        <a href="${filename}" class="detail-link">詳細を見る →</a>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>シミュレーション統合レポート</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      color: white;
      margin-bottom: 40px;
    }

    .header h1 {
      font-size: 3em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }

    .header p {
      font-size: 1.2em;
      opacity: 0.9;
    }

    .profiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }

    .profile-card {
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      transition: transform 0.3s, box-shadow 0.3s;
      animation: fadeInUp 0.5s ease-out;
    }

    .profile-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .profile-card h3 {
      color: #667eea;
      font-size: 1.5em;
      margin-bottom: 10px;
    }

    .description {
      color: #666;
      margin-bottom: 20px;
      line-height: 1.6;
    }

    .stats-mini {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }

    .stat-mini {
      text-align: center;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .stat-mini .label {
      display: block;
      font-size: 0.8em;
      color: #666;
      margin-bottom: 5px;
    }

    .stat-mini .value {
      display: block;
      font-size: 1.5em;
      font-weight: bold;
    }

    .stat-mini .value.good {
      color: #10b981;
    }

    .stat-mini .value.bad {
      color: #ef4444;
    }

    .stat-mini .value.neutral {
      color: #f59e0b;
    }

    .detail-link {
      display: inline-block;
      color: #667eea;
      text-decoration: none;
      font-weight: bold;
      padding: 10px 20px;
      border: 2px solid #667eea;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .detail-link:hover {
      background: #667eea;
      color: white;
    }

    .info-box {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 40px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .info-box h2 {
      color: #667eea;
      margin-bottom: 15px;
    }

    .info-box ul {
      list-style: none;
      padding-left: 0;
    }

    .info-box li {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-box li:last-child {
      border-bottom: none;
    }

    .footer {
      text-align: center;
      color: white;
      padding: 20px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 シミュレーション統合レポート</h1>
      <p>QuestionScheduler 出題機能検証結果</p>
      <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
    </div>

    <div class="info-box">
      <h2>🎯 検証項目</h2>
      <ul>
        <li>✅ メタAI（QuestionScheduler）がシグナルを正しく検出するか</li>
        <li>✅ category更新ロジックが機能し、復習単語が優先出題されるか</li>
        <li>✅ 「まだまだ・分からない」（incorrect）や「学習中・要復習」（still_learning）が解消されるか</li>
        <li>✅ 各生徒プロファイルに応じた適切な出題調整が行われるか</li>
      </ul>
    </div>

    <div class="profiles-grid">
      ${profileCards}
    </div>

    <div class="footer">
      <p>QuestionScheduler シミュレーションシステム v1.0</p>
    </div>
  </div>
</body>
</html>
  `;
}

// メイン実行
main().catch(error => {
  console.error('\n❌ エラーが発生しました:');
  console.error(error);
  process.exit(1);
});
