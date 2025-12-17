/**
 * 学習AIシミュレーション実行スクリプト
 */

import { runAllSimulations } from '../src/ai/simulation/learningAISimulator';

console.log('\n学習AIネットワーク シミュレーション');
console.log('=====================================\n');
console.log('5種類の生徒パターンで30問のクイズをシミュレート');
console.log('AIがどのように問題を再出題するかを確認します。\n');

const results = runAllSimulations();
console.log(results);

console.log('\n\n【シミュレーション完了】');
console.log('各生徒タイプに応じて、AIが異なる再出題戦略を選択しています。');
console.log('- 「分からない」問題は常に最優先');
console.log('- 時間経過に応じて優先度がブースト');
console.log('- 「覚えてる」問題は後回し\n');
