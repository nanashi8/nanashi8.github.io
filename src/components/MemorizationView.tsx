import { useState, useEffect, useRef, useCallback } from 'react';
import { Question, MemorizationCardState, MemorizationBehavior } from '../types';
import { 
  getMemorizationCardSettings, 
  saveMemorizationCardSettings,
  recordMemorizationBehavior,
  getMemorizationSettings
} from '../progressStorage';
import { speakEnglish } from '../speechSynthesis';
import ScoreBoard from './ScoreBoard';

interface MemorizationViewProps {
  allQuestions: Question[];
}

function MemorizationView({ allQuestions }: MemorizationViewProps) {
  // 学習中・復習中の上限設定（デフォルト値）
  const learningLimit = 20;
  const reviewLimit = 30;
  
  // カード表示設定（永続化）
  const [cardState, setCardState] = useState<MemorizationCardState>({
    showWord: true,
    showMeaning: true,
    showPronunciation: false,
    showExample: false,
    showEtymology: false,
    showRelated: false,
  });
  
  // 音声設定
  const [autoVoice, setAutoVoice] = useState(false);
  const [voiceWithMeaning, setVoiceWithMeaning] = useState(false);
  
  // 現在表示中の語句
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // セッション管理
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [consecutiveViews, setConsecutiveViews] = useState(0);
  
  // セッション統計
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0,
  });
  
  // 回答時刻（ScoreBoard更新用）
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(0);
  
  // 滞在時間計測
  const cardDisplayTimeRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // タッチ開始位置とカード要素のref
  const touchStartX = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 初期化: カード表示設定と音声設定を読み込み
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedCardSettings = await getMemorizationCardSettings();
        if (savedCardSettings) {
          setCardState(savedCardSettings);
        }
        
        const memSettings = await getMemorizationSettings();
        if (memSettings) {
          setAutoVoice(memSettings.autoVoice || false);
          setVoiceWithMeaning(memSettings.voiceWithMeaning || false);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('設定の読み込みエラー:', error);
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // 出題する語句を選択（シンプルな実装、後でAI最適化）
  useEffect(() => {
    if (allQuestions.length === 0 || isLoading) return;
    
    const selectQuestions = () => {
      // Phase 1: シンプルにランダム選択（後でAI判定を追加）
      const totalLimit = learningLimit + reviewLimit;
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(totalLimit, allQuestions.length));
      
      setQuestions(selected);
      if (selected.length > 0) {
        setCurrentQuestion(selected[0]);
        setCurrentIndex(0);
        cardDisplayTimeRef.current = Date.now();
      }
    };
    
    selectQuestions();
  }, [allQuestions, learningLimit, reviewLimit, isLoading]);
  
  // 音声読み上げ（カード表示時）
  useEffect(() => {
    if (!currentQuestion || !autoVoice) return;
    
    const speakCard = async () => {
      // 語句を読み上げ
      speakEnglish(currentQuestion.word, { rate: 0.85 });
      
      // 意味も読み上げ（設定がONの場合）
      if (voiceWithMeaning) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5秒待機
        // 日本語の意味は読まない（英語のみ）
      }
    };
    
    speakCard();
  }, [currentQuestion, autoVoice, voiceWithMeaning]);
  
  // カード表示設定の切り替え（永続化）
  const toggleCardField = async (field: keyof MemorizationCardState) => {
    if (field === 'showWord') return; // 単語は常に表示
    
    const newState = {
      ...cardState,
      [field]: !cardState[field],
    };
    
    setCardState(newState);
    await saveMemorizationCardSettings(newState);
  };
  
  // スワイプ処理（useCallbackで最適化）
  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!currentQuestion) return;
    
    // 滞在時間を記録
    const viewDuration = (Date.now() - cardDisplayTimeRef.current) / 1000; // 秒単位
    
    // 統計を更新
    setSessionStats(prev => ({
      correct: direction === 'right' ? prev.correct + 1 : prev.correct,
      incorrect: direction === 'left' ? prev.incorrect + 1 : prev.incorrect,
      total: prev.total + 1,
    }));
    
    // 回答時刻を更新
    setLastAnswerTime(Date.now());
    
    // 16秒以上は放置とみなしてカウントしない
    if (viewDuration < 16) {
      const behavior: MemorizationBehavior = {
        word: currentQuestion.word,
        timestamp: Date.now(),
        viewDuration,
        swipeDirection: direction,
        sessionId,
        consecutiveViews: consecutiveViews + 1,
      };
      
      await recordMemorizationBehavior(behavior);
      setConsecutiveViews(prev => prev + 1);
    }
    
    // 次の語句へ
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < questions.length) {
      setCurrentQuestion(questions[nextIndex]);
      setCurrentIndex(nextIndex);
      cardDisplayTimeRef.current = Date.now();
    } else {
      // 全て終了
      setCurrentQuestion(null);
    }
  }, [currentQuestion, currentIndex, questions, sessionId, consecutiveViews]);
  
  // スワイプイベントリスナー追加（handleSwipeの後に配置）
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX.current;
      
      // 100px以上のスワイプで判定
      if (Math.abs(diff) > 100) {
        if (diff > 0) {
          // 右スワイプ（覚えた）
          handleSwipe('right');
        } else {
          // 左スワイプ（覚えていない）
          handleSwipe('left');
        }
      }
    };
    
    card.addEventListener('touchstart', handleTouchStart);
    card.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      card.removeEventListener('touchstart', handleTouchStart);
      card.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleSwipe]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl mb-4">🎉 今日の暗記完了！</div>
          <div className="text-gray-600 dark:text-gray-400">
            お疲れ様でした。明日も頑張りましょう！
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* スコアボード */}
      <div className="max-w-6xl mx-auto mb-4">
        <ScoreBoard 
          mode="memorization"
          sessionCorrect={sessionStats.correct}
          sessionIncorrect={sessionStats.incorrect}
          totalAnswered={sessionStats.total}
          onAnswerTime={lastAnswerTime}
          onShowSettings={() => alert('暗記タブの学習設定は現在開発中です。\n\n今後、以下の設定を追加予定：\n- 学習中の上限設定\n- 要復習の上限設定\n- 自動音声再生')}
        />
      </div>
      
      {/* 暗記カード */}
      <div className="max-w-6xl mx-auto">
        <div ref={cardRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {/* 語句と矢印 */}
          <div className="flex items-center gap-4 mb-6">
            {/* 左ボタン - まだ覚えていない */}
            <button
              onClick={() => handleSwipe('left')}
              className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition flex items-center justify-center text-2xl"
              aria-label="まだ覚えていない"
            >
              ←
            </button>
            
            {/* 単語（常に表示）*/}
            <div className="flex-1 text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {currentQuestion.word}
              </div>
            </div>
            
            {/* 右ボタン - 覚えた */}
            <button
              onClick={() => handleSwipe('right')}
              className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition flex items-center justify-center text-2xl"
              aria-label="覚えた"
            >
              →
            </button>
          </div>
          
          {/* 詳細情報（横並びレイアウト） */}
          <div className="space-y-3">
            {/* 意味 */}
            <button
              onClick={() => toggleCardField('showMeaning')}
              className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
            >
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">意味</span>
                <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {cardState.showMeaning ? '▼' : '▶'}
                </span>
                {cardState.showMeaning && (
                  <div className="flex-1 text-lg text-gray-900 dark:text-white">
                    {currentQuestion.meaning}
                  </div>
                )}
              </div>
            </button>
            
            {/* 読み */}
            <button
              onClick={() => toggleCardField('showPronunciation')}
              className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
            >
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">読み</span>
                <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {cardState.showPronunciation ? '▼' : '▶'}
                </span>
                {cardState.showPronunciation && (
                  <div className="flex-1 text-base text-gray-700 dark:text-gray-300">
                    {currentQuestion.reading}
                  </div>
                )}
              </div>
            </button>
            
            {/* 語源 */}
            {currentQuestion.etymology && 
             currentQuestion.etymology.trim() !== '' &&
             currentQuestion.etymology !== '中学英語で重要な単語です。' && (
              <button
                onClick={() => toggleCardField('showEtymology')}
                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">語源・解説</span>
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {cardState.showEtymology ? '▼' : '▶'}
                  </span>
                  {cardState.showEtymology && (
                    <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                      {currentQuestion.etymology}
                    </div>
                  )}
                </div>
              </button>
            )}
            
            {/* 関連語 */}
            {currentQuestion.relatedWords && 
             currentQuestion.relatedWords.trim() !== '' && (
              <button
                onClick={() => toggleCardField('showRelated')}
                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">関連語</span>
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {cardState.showRelated ? '▼' : '▶'}
                  </span>
                  {cardState.showRelated && (
                    <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                      {currentQuestion.relatedWords}
                    </div>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 進捗とヒント */}
      <div className="max-w-6xl mx-auto mt-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>{currentIndex + 1} / {questions.length}</span>
          <span>連続: {consecutiveViews}枚</span>
        </div>
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          💡 各項目をタップすると表示/非表示を切り替えられます
        </div>
      </div>
    </div>
  );
}

export default MemorizationView;
