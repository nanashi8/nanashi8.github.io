import { useState, useEffect, useRef } from 'react';
import type { Question, SpellingState } from '@/types';

/**
 * スペリングゲームのコアロジックを管理するフック
 * 
 * 機能:
 * - 文字のシャッフル
 * - 文字選択シーケンスの管理
 * - 熟語（複数単語）の対応
 * - 正誤判定
 */
export function useSpellingGame(questions: Question[]) {
  // スペリングクイズの状態
  const [spellingState, setSpellingState] = useState<SpellingState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    totalAnswered: 0,
    answered: false,
    selectedLetters: [],
    correctWord: '',
  });

  // シャッフルされたアルファベットカード
  const [shuffledLetters, setShuffledLetters] = useState<string[]>([]);
  
  // ユーザーが選択した順番のアルファベット（インデックスの配列）
  const [selectedSequence, setSelectedSequence] = useState<string[]>([]);
  
  // 熟語の場合の各単語（スペース区切り）
  const [phraseWords, setPhraseWords] = useState<string[]>([]);
  
  // 現在入力中の単語インデックス
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  
  // 各単語の入力結果
  const [completedWords, setCompletedWords] = useState<string[]>([]);

  // 問題開始時刻（回答時間計測用）
  const questionStartTimeRef = useRef<number>(0);

  // questionsが変更されたらスペルステートを初期化
  useEffect(() => {
    if (questions.length > 0) {
      setSpellingState({
        questions,
        currentIndex: 0,
        score: 0,
        totalAnswered: 0,
        answered: false,
        selectedLetters: [],
        correctWord: '',
      });
    }
  }, [questions]);

  // 現在の問題が変更されたらアルファベットをシャッフル
  useEffect(() => {
    if (spellingState.questions.length > 0) {
      const currentQuestion = spellingState.questions[spellingState.currentIndex];
      const word = currentQuestion.word.toLowerCase();
      
      // 熟語かどうかを判定（スペースが含まれているか）
      if (word.includes(' ')) {
        // 熟語の場合：単語ごとに分割
        const words = word.split(/\s+/);
        setPhraseWords(words);
        setCurrentWordIndex(0);
        setCompletedWords([]);
        
        // 最初の単語をシャッフル
        const firstWordLetters = words[0].split('');
        const shuffled = [...firstWordLetters].sort(() => Math.random() - 0.5);
        setShuffledLetters(shuffled);
        
        setSpellingState((prev) => ({
          ...prev,
          correctWord: word.replace(/\s+/g, ''),
          answered: false,
        }));
      } else {
        // 単語の場合：従来通り
        setPhraseWords([]);
        setCurrentWordIndex(0);
        setCompletedWords([]);
        
        const letters = word.split('');
        const shuffled = [...letters].sort(() => Math.random() - 0.5);
        setShuffledLetters(shuffled);
        
        setSpellingState((prev) => ({
          ...prev,
          correctWord: word,
          answered: false,
        }));
      }
      
      setSelectedSequence([]);
      
      // 問題開始時刻を記録
      questionStartTimeRef.current = Date.now();
    }
  }, [spellingState.currentIndex, spellingState.questions]);

  /**
   * カードをタップして選択
   */
  const handleLetterClick = (index: number) => {
    // 回答後は練習モード（選択のみ、答え合わせはしない）
    if (spellingState.answered) {
      // 選択/選択解除のトグル
      if (selectedSequence.includes(`${index}`)) {
        setSelectedSequence(selectedSequence.filter(idx => idx !== `${index}`));
      } else {
        const newSequence = [...selectedSequence, `${index}`];
        setSelectedSequence(newSequence);
      }
      return;
    }
    
    // まだ選択されていないカードのみ選択可能
    if (selectedSequence.includes(`${index}`)) return;

    const newSequence = [...selectedSequence, `${index}`];
    setSelectedSequence(newSequence);

    // 全てのカードが選択されたら自動で答え合わせ
    if (newSequence.length === shuffledLetters.length) {
      return newSequence; // 親コンポーネントで答え合わせ処理を実行
    }
    
    return null;
  };

  /**
   * 答え合わせ（熟語・単語対応）
   * @returns { isCorrect, userWord, responseTime }
   */
  const checkAnswer = (sequence: string[]) => {
    const userWord = sequence.map((idx) => shuffledLetters[parseInt(idx)]).join('');
    const responseTime = Date.now() - questionStartTimeRef.current;
    
    // 熟語の場合：現在の単語が正しいか確認
    if (phraseWords.length > 0) {
      const currentTargetWord = phraseWords[currentWordIndex];
      const isWordCorrect = userWord === currentTargetWord;
      
      if (isWordCorrect) {
        // 正解：次の単語へ
        const newCompletedWords = [...completedWords, userWord];
        setCompletedWords(newCompletedWords);
        
        if (currentWordIndex < phraseWords.length - 1) {
          // まだ次の単語がある：次の単語をシャッフル
          const nextWordIndex = currentWordIndex + 1;
          setCurrentWordIndex(nextWordIndex);
          
          const nextWordLetters = phraseWords[nextWordIndex].split('');
          const shuffled = [...nextWordLetters].sort(() => Math.random() - 0.5);
          setShuffledLetters(shuffled);
          setSelectedSequence([]);
          
          return { isPartialCorrect: true, isComplete: false, userWord, responseTime };
        } else {
          // 全ての単語が完成：最終判定
          const fullUserWord = newCompletedWords.join('');
          const isFullCorrect = fullUserWord === spellingState.correctWord;
          
          return { 
            isPartialCorrect: true, 
            isComplete: true, 
            isCorrect: isFullCorrect, 
            userWord: fullUserWord, 
            responseTime 
          };
        }
      } else {
        // 不正解：現在の単語が間違っている
        const fullUserWord = [...completedWords, userWord].join('');
        return { 
          isPartialCorrect: false, 
          isComplete: true, 
          isCorrect: false, 
          userWord: fullUserWord, 
          responseTime 
        };
      }
    } else {
      // 単語の場合：従来通り
      const isCorrect = userWord === spellingState.correctWord;
      return { isComplete: true, isCorrect, userWord, responseTime };
    }
  };

  /**
   * 次の問題へ進む
   */
  const moveToNextQuestion = () => {
    setSpellingState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      answered: false,
    }));
  };

  /**
   * スコアを更新
   */
  const updateScore = (isCorrect: boolean) => {
    setSpellingState((prev) => ({
      ...prev,
      score: isCorrect ? prev.score + 1 : prev.score,
      totalAnswered: prev.totalAnswered + 1,
      answered: true,
    }));
  };

  /**
   * リセット（やり直し）
   */
  const resetAnswer = () => {
    setSelectedSequence([]);
    setSpellingState((prev) => ({
      ...prev,
      answered: false,
    }));
    
    // 現在の単語を再シャッフル
    if (phraseWords.length > 0) {
      const currentWordLetters = phraseWords[currentWordIndex].split('');
      const shuffled = [...currentWordLetters].sort(() => Math.random() - 0.5);
      setShuffledLetters(shuffled);
    } else {
      const currentQuestion = spellingState.questions[spellingState.currentIndex];
      const letters = currentQuestion.word.toLowerCase().split('');
      const shuffled = [...letters].sort(() => Math.random() - 0.5);
      setShuffledLetters(shuffled);
    }
    
    questionStartTimeRef.current = Date.now();
  };

  return {
    spellingState,
    setSpellingState,
    shuffledLetters,
    selectedSequence,
    setSelectedSequence,
    phraseWords,
    currentWordIndex,
    completedWords,
    handleLetterClick,
    checkAnswer,
    moveToNextQuestion,
    updateScore,
    resetAnswer,
  };
}
