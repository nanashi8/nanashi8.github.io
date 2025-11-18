// AIコメント生成のテストケース
import { generateAIComment } from './aiCommentGenerator';
import { CommentContext } from './types';

// テスト用のコンテキスト生成ヘルパー
function createContext(overrides: Partial<CommentContext> = {}): CommentContext {
  return {
    word: 'test',
    isCorrect: true,
    attemptCount: 1,
    responseTime: 5000,
    difficulty: 'intermediate',
    category: 'general',
    correctStreak: 0,
    incorrectStreak: 0,
    userAccuracy: 75,
    categoryAccuracy: 75,
    todayAccuracy: 75,
    todayQuestions: 10,
    isWeakCategory: false,
    hasSeenBefore: false,
    previousAttempts: 0,
    planProgress: 50,
    timeOfDay: 'afternoon',
    ...overrides
  };
}

// テスト実行
console.log('=== AIコメント生成テスト ===\n');

// Test 1: 1回目で正解
console.log('Test 1: 1回目で正解');
const ctx1 = createContext({ attemptCount: 1, isCorrect: true });
console.log('鬼軍曹:', generateAIComment('drill-sergeant', ctx1));
console.log('優しい先生:', generateAIComment('kind-teacher', ctx1));
console.log('熱血コーチ:', generateAIComment('enthusiastic-coach', ctx1));
console.log('冷静な分析官:', generateAIComment('analyst', ctx1));
console.log('');

// Test 2: 2回目で正解
console.log('Test 2: 2回目で正解');
const ctx2 = createContext({ attemptCount: 2, isCorrect: true });
console.log('鬼軍曹:', generateAIComment('drill-sergeant', ctx2));
console.log('優しい先生:', generateAIComment('kind-teacher', ctx2));
console.log('熱血コーチ:', generateAIComment('enthusiastic-coach', ctx2));
console.log('冷静な分析官:', generateAIComment('analyst', ctx2));
console.log('');

// Test 3: 3回目で正解
console.log('Test 3: 3回目で正解');
const ctx3 = createContext({ attemptCount: 3, isCorrect: true });
console.log('鬼軍曹:', generateAIComment('drill-sergeant', ctx3));
console.log('優しい先生:', generateAIComment('kind-teacher', ctx3));
console.log('熱血コーチ:', generateAIComment('enthusiastic-coach', ctx3));
console.log('冷静な分析官:', generateAIComment('analyst', ctx3));
console.log('');

// Test 4: 5回目で正解
console.log('Test 4: 5回目で正解');
const ctx4 = createContext({ attemptCount: 5, isCorrect: true });
console.log('鬼軍曹:', generateAIComment('drill-sergeant', ctx4));
console.log('優しい先生:', generateAIComment('kind-teacher', ctx4));
console.log('熱血コーチ:', generateAIComment('enthusiastic-coach', ctx4));
console.log('冷静な分析官:', generateAIComment('analyst', ctx4));
console.log('');

// Test 5: 1回目で不正解
console.log('Test 5: 1回目で不正解');
const ctx5 = createContext({ attemptCount: 1, isCorrect: false });
console.log('鬼軍曹:', generateAIComment('drill-sergeant', ctx5));
console.log('優しい先生:', generateAIComment('kind-teacher', ctx5));
console.log('熱血コーチ:', generateAIComment('enthusiastic-coach', ctx5));
console.log('冷静な分析官:', generateAIComment('analyst', ctx5));
console.log('');

// Test 6: 2回目で不正解
console.log('Test 6: 2回目で不正解');
const ctx6 = createContext({ attemptCount: 2, isCorrect: false });
console.log('鬼軍曹:', generateAIComment('drill-sergeant', ctx6));
console.log('優しい先生:', generateAIComment('kind-teacher', ctx6));
console.log('熱血コーチ:', generateAIComment('enthusiastic-coach', ctx6));
console.log('冷静な分析官:', generateAIComment('analyst', ctx6));
console.log('');

// Test 7: 3連続正解 + 2回目で正解
console.log('Test 7: 3連続正解中、2回目で正解');
const ctx7 = createContext({ 
  attemptCount: 2, 
  isCorrect: true, 
  correctStreak: 3 
});
console.log('鬼軍曹:', generateAIComment('drill-sergeant', ctx7));
console.log('優しい先生:', generateAIComment('kind-teacher', ctx7));
console.log('熱血コーチ:', generateAIComment('enthusiastic-coach', ctx7));
console.log('');

// Test 8: 上級単語を1回目で正解
console.log('Test 8: 上級単語を1回目で正解');
const ctx8 = createContext({ 
  attemptCount: 1, 
  isCorrect: true, 
  difficulty: 'advanced',
  word: 'consequence'
});
console.log('鬼軍曹:', generateAIComment('drill-sergeant', ctx8));
console.log('優しい先生:', generateAIComment('kind-teacher', ctx8));
console.log('熱血コーチ:', generateAIComment('enthusiastic-coach', ctx8));
console.log('');

// Test 9: 初級単語を3回目で正解
console.log('Test 9: 初級単語を3回目で正解');
const ctx9 = createContext({ 
  attemptCount: 3, 
  isCorrect: true, 
  difficulty: 'beginner',
  word: 'apple'
});
console.log('鬼軍曹:', generateAIComment('drill-sergeant', ctx9));
console.log('優しい先生:', generateAIComment('kind-teacher', ctx9));
console.log('熱血コーチ:', generateAIComment('enthusiastic-coach', ctx9));
console.log('');

// Test 10: 苦手カテゴリーを2回目で正解
console.log('Test 10: 苦手カテゴリーを2回目で正解');
const ctx10 = createContext({ 
  attemptCount: 2, 
  isCorrect: true,
  isWeakCategory: true,
  category: '動詞'
});
console.log('鬼軍曹:', generateAIComment('drill-sergeant', ctx10));
console.log('優しい先生:', generateAIComment('kind-teacher', ctx10));
console.log('熱血コーチ:', generateAIComment('enthusiastic-coach', ctx10));
console.log('');

console.log('=== テスト完了 ===');
console.log('\n検証ポイント:');
console.log('✓ 1回目正解は「1回目」と明示されていないこと');
console.log('✓ 2回目正解は「2回目」と明示されること');
console.log('✓ 3回目以降正解は「3回目」「5回目」など正確な回数が表示されること');
console.log('✓ 不正解時も回数が正確に反映されること');
console.log('✓ 他の条件（ストリーク、難易度など）も適切に反映されること');
