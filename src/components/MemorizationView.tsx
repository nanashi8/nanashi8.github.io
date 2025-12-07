import { useState, useEffect, useRef, useCallback } from 'react';
import { Question, MemorizationCardState, MemorizationBehavior, QuestionSet } from '../types';
import { 
  getMemorizationCardSettings, 
  saveMemorizationCardSettings,
  recordMemorizationBehavior,
  getMemorizationSettings,
  saveMemorizationSettings
} from '../progressStorage';
import { speakEnglish } from '../speechSynthesis';
import ScoreBoard from './ScoreBoard';

interface MemorizationViewProps {
  allQuestions: Question[];
  questionSets: QuestionSet[];
}

function MemorizationView({ allQuestions, questionSets }: MemorizationViewProps) {
  // 学習設定
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<string>('all');
  const [selectedQuestionSet, setSelectedQuestionSet] = useState<string>('main-set');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedWordPhraseFilter, setSelectedWordPhraseFilter] = useState<string>('all');
  
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
  const [voiceWord, setVoiceWord] = useState(true); // 語句を読み上げ
  const [voiceMeaning, setVoiceMeaning] = useState(false); // 意味も読み上げ
  const [voiceDelay, setVoiceDelay] = useState(1.5); // 語句と意味の間の待機時間（秒）
  
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
          setVoiceWord(memSettings.voiceWord !== undefined ? memSettings.voiceWord : true);
          setVoiceMeaning(memSettings.voiceMeaning || false);
          setVoiceDelay(memSettings.voiceDelay !== undefined ? memSettings.voiceDelay : 1.5);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('設定の読み込みエラー:', error);
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // 関連分野のリストを取得
  const getAvailableCategories = (): string[] => {
    const categories = new Set<string>();
    allQuestions.forEach(q => {
      if (q.relatedFields && Array.isArray(q.relatedFields)) {
        q.relatedFields.forEach(field => categories.add(field));
      }
    });
    return Array.from(categories).sort();
  };
  
  // 出題する語句を選択（シンプルな実装、後でAI最適化）
  useEffect(() => {
    if (isLoading) return;
    
    const selectQuestions = () => {
      // 問題セットを選択
      const selectedSet = questionSets.find(qs => qs.id === selectedQuestionSet);
      const baseQuestions = selectedSet ? selectedSet.questions : allQuestions;
      
      if (baseQuestions.length === 0) return;
      
      // 学習設定に基づいてフィルタリング
      let filtered = baseQuestions;
      
      // 関連分野フィルター
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(q => 
          q.relatedFields && Array.isArray(q.relatedFields) && q.relatedFields.includes(selectedCategory)
        );
      }
      
      // Phase 1: シンプルにランダム選択（後でAI判定を追加）
      const totalLimit = learningLimit + reviewLimit;
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(totalLimit, filtered.length));
      
      setQuestions(selected);
      if (selected.length > 0) {
        setCurrentQuestion(selected[0]);
        setCurrentIndex(0);
        cardDisplayTimeRef.current = Date.now();
      }
    };
    
    selectQuestions();
  }, [questionSets, selectedQuestionSet, allQuestions, learningLimit, reviewLimit, isLoading, selectedCategory]);
  
  // 音声読み上げ（カード表示時）
  useEffect(() => {
    if (!currentQuestion || !autoVoice) return;
    
    const speakCard = async () => {
      // 語句を読み上げ（設定がONの場合）
      if (voiceWord) {
        speakEnglish(currentQuestion.word, { rate: 0.85 });
      }
      
      // 意味も読み上げ（設定がONの場合）
      if (voiceMeaning && currentQuestion.meaning) {
        await new Promise(resolve => setTimeout(resolve, voiceDelay * 1000)); // 設定された秒数待機
        // 日本語の意味を読み上げ
        const utterance = new SpeechSynthesisUtterance(currentQuestion.meaning);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      }
    };
    
    speakCard();
    // voiceWord, voiceMeaning, voiceDelayを依存配列から除外（設定変更時の音声再生を防ぐ）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, autoVoice]);
  
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
  
  // 音声設定の保存
  const updateVoiceSettings = async (autoVoiceVal: boolean, voiceWordVal: boolean, voiceMeaningVal: boolean, voiceDelayVal?: number) => {
    setAutoVoice(autoVoiceVal);
    setVoiceWord(voiceWordVal);
    setVoiceMeaning(voiceMeaningVal);
    if (voiceDelayVal !== undefined) {
      setVoiceDelay(voiceDelayVal);
    }
    
    await saveMemorizationSettings({
      autoVoice: autoVoiceVal,
      voiceWord: voiceWordVal,
      voiceMeaning: voiceMeaningVal,
      voiceDelay: voiceDelayVal !== undefined ? voiceDelayVal : voiceDelay,
      interleavingMode: 'off',
      cardDisplaySettings: cardState,
    });
  };
  
  // スワイプ処理（useCallbackで最適化）
  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!currentQuestion) return;
    
    // 滞在時間を記録
    const viewDuration = (Date.now() - cardDisplayTimeRef.current) / 1000; // 秒単位
    
    const isCorrect = direction === 'right';
    
    // 統計を更新
    setSessionStats(prev => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1,
      total: prev.total + 1,
    }));
    
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
      
      // 進捗データにも記録（ScoreBoard用）
      const { updateWordProgress } = await import('../progressStorage');
      await updateWordProgress(
        currentQuestion.word,
        isCorrect,
        viewDuration * 1000, // ミリ秒に変換
        undefined,
        'translation' // 暗記タブも翻訳モードとして記録
      );
    }
    
    // データ保存後に回答時刻を更新（ScoreBoard再計算のトリガー）
    setLastAnswerTime(Date.now());
    
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
    return null; // 上限メッセージを廃止
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
          onShowSettings={() => setShowSettings(true)}
          dataSource={selectedDataSource}
          category={selectedCategory === 'all' ? '全分野' : selectedCategory}
          difficulty={selectedDifficulty}
          wordPhraseFilter={selectedWordPhraseFilter}
        />
      </div>
      
      {/* 学習設定パネル */}
      {showSettings && (
        <div className="max-w-6xl mx-auto mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">📊 学習設定</h3>
            <button 
              onClick={() => setShowSettings(false)} 
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              ✕ 閉じる
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="memorization-questionset" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">📚 問題セット:</label>
              <select 
                id="memorization-questionset"
                value={selectedQuestionSet} 
                onChange={(e) => setSelectedQuestionSet(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                {questionSets.map(qs => (
                  <option key={qs.id} value={qs.id}>
                    {qs.name} ({qs.questions.length}語)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="memorization-datasource" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">📖 データソース:</label>
              <select 
                id="memorization-datasource"
                value={selectedDataSource} 
                onChange={(e) => setSelectedDataSource(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                <option value="all">全問題集</option>
                <option value="junior">高校受験</option>
                <option value="standard">高校受験標準</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="memorization-category" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">🏷️ 関連分野:</label>
              <select 
                id="memorization-category"
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                <option value="all">全分野</option>
                {getAvailableCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="memorization-difficulty" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">📊 難易度:</label>
              <select 
                id="memorization-difficulty"
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                <option value="all">全難易度</option>
                <option value="beginner">初級</option>
                <option value="intermediate">中級</option>
                <option value="advanced">上級</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="memorization-filter" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">📝 単語・熟語:</label>
              <select 
                id="memorization-filter"
                value={selectedWordPhraseFilter} 
                onChange={(e) => setSelectedWordPhraseFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                <option value="all">単語＋熟語</option>
                <option value="words">単語のみ</option>
                <option value="phrases">熟語のみ</option>
              </select>
            </div>
            
            <div className="border-t pt-4 dark:border-gray-700">
              <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">🔊 自動発音設定:</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoVoice}
                    onChange={(e) => updateVoiceSettings(e.target.checked, voiceWord, voiceMeaning)}
                    className="mr-2 w-4 h-4"
                  />
                  <span>自動で発音する</span>
                </label>
                {autoVoice && (
                  <div className="ml-6 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={voiceWord}
                        onChange={(e) => updateVoiceSettings(autoVoice, e.target.checked, voiceMeaning)}
                        className="mr-2 w-4 h-4"
                      />
                      <span>語句を読み上げ</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={voiceMeaning}
                        onChange={(e) => updateVoiceSettings(autoVoice, voiceWord, e.target.checked)}
                        className="mr-2 w-4 h-4"
                      />
                      <span>意味を読み上げ</span>
                    </label>
                    {voiceMeaning && (
                      <div className="ml-6 mt-2">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          ⏱️ 語句と意味の間隔: {voiceDelay.toFixed(1)}秒
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="5.0"
                          step="0.5"
                          value={voiceDelay}
                          onChange={(e) => {
                            const newDelay = parseFloat(e.target.value);
                            setVoiceDelay(newDelay);
                            updateVoiceSettings(autoVoice, voiceWord, voiceMeaning, newDelay);
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          aria-label="語句と意味の間隔"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>0.5秒</span>
                          <span>5.0秒</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
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
