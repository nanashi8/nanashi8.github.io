import { useState, useEffect, useRef } from 'react';
import { Question, MemorizationCardState, MemorizationBehavior } from '../types';
import { 
  getMemorizationCardSettings, 
  saveMemorizationCardSettings,
  recordMemorizationBehavior,
  getMemorizationSettings
} from '../progressStorage';
import { speakEnglish } from '../speechSynthesis';

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
  
  // 滞在時間計測
  const cardDisplayTimeRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  // スワイプ処理
  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentQuestion) return;
    
    // 滞在時間を記録
    const viewDuration = (Date.now() - cardDisplayTimeRef.current) / 1000; // 秒単位
    
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
  };
  
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
      {/* 進捗表示 */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>{currentIndex + 1} / {questions.length}</span>
          <span>連続: {consecutiveViews}枚</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{
              width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%`
            }}
          />
        </div>
      </div>
      
      {/* 暗記カード */}
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側: 単語と意味 */}
          <div>
            {/* 単語（常に表示）*/}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {currentQuestion.word}
              </div>
            </div>
            
            {/* 意味（初期表示）*/}
            <div className="mb-4">
              <button
                onClick={() => toggleCardField('showMeaning')}
                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">意味</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {cardState.showMeaning ? '▼' : '▶'}
                  </span>
                </div>
                {cardState.showMeaning && (
                  <div className="mt-2 text-lg text-gray-900 dark:text-white">
                    {currentQuestion.meaning}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* 右側: 詳細情報 */}
          <div className="space-y-4">
            {/* 読み（タップで切り替え）*/}
            <div>
              <button
                onClick={() => toggleCardField('showPronunciation')}
                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">読み</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {cardState.showPronunciation ? '▼' : '▶'}
                  </span>
                </div>
                {cardState.showPronunciation && (
                  <div className="mt-2 text-base text-gray-700 dark:text-gray-300">
                    {currentQuestion.reading}
                  </div>
                )}
              </button>
            </div>
            
            {/* 語源（タップで切り替え）*/}
            {currentQuestion.etymology && (
              <div>
                <button
                  onClick={() => toggleCardField('showEtymology')}
                  className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">語源・解説</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {cardState.showEtymology ? '▼' : '▶'}
                    </span>
                  </div>
                  {cardState.showEtymology && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {currentQuestion.etymology}
                    </div>
                  )}
                </button>
              </div>
            )}
            
            {/* 関連語（タップで切り替え）*/}
            {currentQuestion.relatedWords && (
              <div>
                <button
                  onClick={() => toggleCardField('showRelated')}
                  className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">関連語</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {cardState.showRelated ? '▼' : '▶'}
                    </span>
                  </div>
                  {cardState.showRelated && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {currentQuestion.relatedWords}
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* スワイプボタン */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => handleSwipe('left')}
            className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition"
          >
            ← まだ覚えていない
          </button>
          <button
            onClick={() => handleSwipe('right')}
            className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition"
          >
            覚えた →
          </button>
        </div>
      </div>
      
      {/* ヒント */}
      <div className="max-w-6xl mx-auto mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        💡 各項目をタップすると表示/非表示を切り替えられます
      </div>
    </div>
  );
}

export default MemorizationView;
