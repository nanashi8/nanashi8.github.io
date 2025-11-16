// 和訳タブ正解判定テスト
// このファイルはビルドには含まれません

interface TestCase {
  name: string;
  answer: string;
  correct: string;
  expected: boolean;
}

const testCases: TestCase[] = [
  // 正常ケース
  { name: "完全一致", answer: "リンゴ", correct: "リンゴ", expected: true },
  { name: "英語の完全一致", answer: "apple", correct: "apple", expected: true },
  { name: "熟語の完全一致", answer: "あきらめる", correct: "あきらめる", expected: true },
  
  // 不正解ケース
  { name: "異なる選択肢", answer: "本", correct: "リンゴ", expected: false },
  { name: "部分一致", answer: "リン", correct: "リンゴ", expected: false },
  
  // 空白処理のテスト
  { name: "前の空白", answer: " リンゴ", correct: "リンゴ", expected: true },
  { name: "後ろの空白", answer: "リンゴ ", correct: "リンゴ", expected: true },
  { name: "前後の空白", answer: " リンゴ ", correct: "リンゴ", expected: true },
  { name: "正解側の空白", answer: "リンゴ", correct: " リンゴ ", expected: true },
  { name: "両側の空白", answer: " リンゴ ", correct: " リンゴ ", expected: true },
  
  // 特殊ケース
  { name: "空文字列", answer: "", correct: "リンゴ", expected: false },
  { name: "両方空文字列", answer: "", correct: "", expected: true },
  { name: "全角スペース", answer: "　リンゴ　", correct: "リンゴ", expected: false }, // 全角スペースは異なる文字として扱われる
  { name: "大文字小文字（英語）", answer: "Apple", correct: "apple", expected: false },
  
  // 実際のCSVデータパターン
  { name: "CSV実データ1", answer: "〜できる", correct: "〜できる", expected: true },
  { name: "CSV実データ2", answer: "〜について", correct: "〜について", expected: true },
  { name: "CSV実データ3", answer: "受け入れる", correct: "受け入れる", expected: true },
];

// 正解判定関数（App.tsxから抽出）
function checkAnswer(answer: string, correct: string): boolean {
  const normalizedAnswer = answer.trim();
  const normalizedCorrect = correct.trim();
  return normalizedAnswer === normalizedCorrect;
}

// テスト実行
function runTests() {
  console.log("🧪 和訳タブ正解判定テスト\n");
  
  let passedCount = 0;
  let failedCount = 0;
  const failures: Array<{test: TestCase, actual: boolean}> = [];
  
  testCases.forEach((testCase) => {
    const actual = checkAnswer(testCase.answer, testCase.correct);
    const passed = actual === testCase.expected;
    
    if (passed) {
      passedCount++;
      console.log(`✅ ${testCase.name}`);
    } else {
      failedCount++;
      failures.push({ test: testCase, actual });
      console.log(`❌ ${testCase.name}`);
      console.log(`   期待: ${testCase.expected}, 実際: ${actual}`);
      console.log(`   答え: "${testCase.answer}", 正解: "${testCase.correct}"`);
    }
  });
  
  console.log(`\n📊 テスト結果`);
  console.log(`合計: ${testCases.length}件`);
  console.log(`✅ 成功: ${passedCount}件`);
  console.log(`❌ 失敗: ${failedCount}件`);
  console.log(`成功率: ${((passedCount / testCases.length) * 100).toFixed(1)}%`);
  
  if (failures.length > 0) {
    console.log(`\n❌ 失敗したテスト:`);
    failures.forEach(({test, actual}) => {
      console.log(`  - ${test.name}: 期待=${test.expected}, 実際=${actual}`);
    });
  } else {
    console.log(`\n🎉 すべてのテストに合格しました！`);
  }
  
  return { passedCount, failedCount, total: testCases.length };
}

// テスト実行
runTests();

export { runTests, testCases };
