// 定着率の実際の値を確認
const progress = JSON.parse(localStorage.getItem('quizProgress') || '{}');
const wordProgresses = Object.values(progress.wordProgress || {});
const appearedWords = wordProgresses.filter(wp => 
  (wp.correctCount + wp.incorrectCount) > 0
);

let masteredCount = 0;
appearedWords.forEach(wp => {
  const totalAttempts = wp.correctCount + wp.incorrectCount;
  const accuracy = totalAttempts > 0 ? (wp.correctCount / totalAttempts) * 100 : 0;
  
  const isDefinitelyMastered = 
    (totalAttempts === 1 && wp.correctCount === 1) ||
    wp.consecutiveCorrect >= 3 ||
    (wp.skippedCount && wp.skippedCount > 0);
  
  const isLikelyMastered = 
    totalAttempts >= 3 && 
    accuracy >= 80 && 
    wp.consecutiveCorrect >= 2;
  
  if (isDefinitelyMastered || isLikelyMastered) {
    masteredCount++;
  }
});

console.log('Appeared words:', appearedWords.length);
console.log('Mastered count:', masteredCount);
console.log('Retention rate:', appearedWords.length > 0 ? (masteredCount / appearedWords.length) * 100 : 0);
console.log('466.7% would mean:', appearedWords.length > 0 ? (appearedWords.length / masteredCount) * 100 : 0);
