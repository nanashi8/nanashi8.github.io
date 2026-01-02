/**
 * 社会科学習ビュー（CSV対応版）
 *
 * 地理・歴史・公民の三択形式
 * - 3択形式（同じ種別から選択肢生成）
 * - 詳細解説表示
 * - CSV形式データ対応
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { Question } from '../types';
import {
  loadSocialStudiesCSV,
  SOCIAL_STUDIES_DATA_SOURCES,
} from '../utils/socialStudiesLoader';
import { useSessionStats } from '../hooks/useSessionStats';
import ScoreBoard from './ScoreBoard';
import QuestionCard from './QuestionCard';

interface SocialStudiesViewProps {
  /** 現在のデータソース */
  dataSource?: string;
}

function normalizeRelatedFields(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    return trimmed
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * 社会科学習ビュー
 */
function SocialStudiesView({ dataSource = 'all-social-studies.csv' }: SocialStudiesViewProps) {
  // ===== 状態管理 =====
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const isClassical = dataSource.includes('classical');

  // 学習設定（社会のみ: 暗記タブと揃える）
  const [selectedDataSource, setSelectedDataSource] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const questionSets = useMemo(() => {
    const bySource = new Map<string, number>();
    for (const q of allQuestions) {
      const source = (q as any).source ? String((q as any).source) : 'junior';
      bySource.set(source, (bySource.get(source) ?? 0) + 1);
    }

    const nameForSource = (source: string): string => {
      switch (source) {
        case 'history':
          return '歴史';
        case 'geography':
          return '地理';
        case 'civics':
          return '公民';
        case 'junior':
          return '中学（総合）';
        default:
          return `社会（${source}）`;
      }
    };

    return Array.from(bySource.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([source, count]) => ({ id: source, name: nameForSource(source), count }));
  }, [allQuestions]);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    allQuestions.forEach((q) => {
      normalizeRelatedFields((q as any).relatedFields).forEach((field) => categories.add(field));
    });
    return Array.from(categories).sort();
  }, [allQuestions]);

  const questions = useMemo(() => {
    // 国語（古文）三択は、現状の設定（バッチ/不正解上限）だけに留める
    if (isClassical) return allQuestions;

    let filtered = allQuestions;

    // 出題元フィルター（source）
    if (selectedDataSource !== 'all') {
      filtered = filtered.filter((q) => String((q as any).source || '') === selectedDataSource);
    }

    // 関連分野フィルター（relatedFields）
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((q) =>
        normalizeRelatedFields((q as any).relatedFields).includes(selectedCategory)
      );
    }

    return filtered;
  }, [allQuestions, isClassical, selectedCategory, selectedDataSource]);

  // 🆕 バッチ数設定（LocalStorageから読み込み）
  const batchSize = (() => {
    try {
      // 社会（三択）は暗記タブと同一キーに揃える
      const key = isClassical ? 'japanese-translation-batch-size' : 'memorization-batch-size';
      const saved = localStorage.getItem(key);
      return saved ? parseInt(saved) : null;
    } catch {
      return null;
    }
  })();

  // 🆕 不正解の上限比率（10-50%）
  const reviewRatioLimit = (() => {
    try {
      // 社会（三択）は暗記タブと同一キーに揃える
      const key = isClassical
        ? 'japanese-translation-review-ratio-limit'
        : 'memorization-review-ratio-limit';
      const saved = localStorage.getItem(key);
      return saved ? parseInt(saved) : 20; // デフォルト20%
    } catch {
      return 20;
    }
  })();

  // タブ固有のセッション統計を管理
  const { sessionStats, setSessionStats, resetStats: resetSessionStats } = useSessionStats('translation');

  // ===== データ読み込み =====
  useEffect(() => {
    loadQuestions();
  }, [dataSource]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await loadSocialStudiesCSV(dataSource);

      // データの入れ替え処理を分ける
      // - 社会科: word=語句（答え）, meaning=意味（問題文）→ 入れ替えが必要
      // - 古文: word=古語（問題）, meaning=現代語訳（答え）→ 入れ替え不要
      const processedData = isClassical
        ? data.map((q) => ({
            ...q,
            // 古文は入れ替えせず、解説のみ調整
            etymology: `${q.etymology}\n\n【語句】${q.word} (${q.reading})\n【意味】${q.meaning}`,
          }))
        : data.map((q) => ({
            ...q,
            // 社会科は入れ替え（QuestionCardは英語用のため）
            word: q.meaning,    // 問題文として表示
            meaning: q.word,    // 選択肢として表示
            etymology: `${q.etymology}\n\n正解: ${q.word} (${q.reading})`,
          }));

      setAllQuestions(processedData);
      setCurrentIndex(0);
      setAnswered(false);
      setSelectedAnswer(null);
      setScore(0);
      setTotalAnswered(0);

      setLoading(false);
    } catch (err) {
      console.error('社会科データ読み込みエラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      setLoading(false);
    }
  };

  // ===== 回答処理 =====
  const handleAnswer = (answer: string, correct: string) => {
    if (answered) return;

    setSelectedAnswer(answer);
    setAnswered(true);

    const isCorrect = answer === correct;
    setTotalAnswered((prev) => prev + 1);
    setScore((prev) => (isCorrect ? prev + 1 : prev));

    // セッション統計を更新（英語三択と同じ粒度）
    setSessionStats((prev) => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (!isCorrect ? 1 : 0),
      newQuestions: prev.newQuestions + 1,
    }));
  };

  // ===== 次の問題へ =====
  const handleNext = () => {
    if (questions.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % questions.length);
    setSelectedAnswer(null);
    setAnswered(false);
  };

  // ===== 前の問題へ =====
  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
    setSelectedAnswer(null);
    setAnswered(false);
  };

  // スキップ（回答前にNextを押した場合）: 英語三択と同じく正解扱いで進める
  const handleSkip = () => {
    if (questions.length === 0) return;

    setScore((prev) => prev + 1);
    setTotalAnswered((prev) => prev + 1);

    setSessionStats((prev) => ({
      ...prev,
      correct: prev.correct + 1,
      mastered: prev.mastered + 1,
    }));

    setCurrentIndex((prev) => (prev + 1) % questions.length);
    setSelectedAnswer(null);
    setAnswered(false);
  };

  const handleNextOrSkip = () => {
    if (answered) {
      handleNext();
    } else {
      handleSkip();
    }
  };

  // ===== リセット =====
  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setTotalAnswered(0);
    resetSessionStats();
  };

  // フィルター変更時は、出題状態をリセット（暗記タブと同様の挙動に揃える）
  useEffect(() => {
    if (isClassical) return;
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setTotalAnswered(0);
    resetSessionStats();
  }, [isClassical, resetSessionStats, selectedCategory, selectedDataSource]);

  // 絞り込みでインデックスが範囲外になった場合の安全策
  useEffect(() => {
    if (currentIndex < questions.length) return;
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
  }, [currentIndex, questions.length]);

  // ===== レンダリング =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">エラーが発生しました</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">問題が見つかりませんでした</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="quiz-view">
      <div className="mb-4 flex justify-center">
        <div className="w-full max-w-4xl">
          <ScoreBoard
            mode="translation"
            currentScore={score}
            totalAnswered={totalAnswered}
            sessionCorrect={sessionStats?.correct}
            sessionIncorrect={sessionStats?.incorrect}
            sessionReview={sessionStats?.review}
            sessionMastered={sessionStats?.mastered}
            currentWord={currentQuestion?.word}
            dataSource={
              SOCIAL_STUDIES_DATA_SOURCES.find((s) => s.filename === dataSource)?.name ||
              '社会'
            }
            onShowSettings={() => setShowSettings(true)}
          />
        </div>
      </div>

      {/* 学習設定パネル */}
      {showSettings && (
        <div className="mb-4 bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">📊 学習設定</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ✕ 閉じる
            </button>
          </div>

          <div className="space-y-4">
            {/* 社会（暗記タブと同一の設定） */}
            {!isClassical && (
              <>
                <div>
                  <label
                    htmlFor="memorization-datasource"
                    className="block text-sm font-medium mb-2 text-gray-700"
                  >
                    📖 出題元:
                  </label>
                  <select
                    id="memorization-datasource"
                    value={selectedDataSource}
                    onChange={(e) => setSelectedDataSource(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">
                      {SOCIAL_STUDIES_DATA_SOURCES.find((s) => s.filename === dataSource)?.name ||
                        '社会（総合）'}
                    </option>
                    {questionSets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="memorization-category"
                    className="block text-sm font-medium mb-2 text-gray-700"
                  >
                    🏷️ 関連分野:
                  </label>
                  <select
                    id="memorization-category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">全分野</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* バッチ数設定 */}
            <div className="border-t pt-4">
              <label
                htmlFor="translation-batch-size"
                className="block text-sm font-medium mb-2 text-gray-700"
              >
                📦 バッチ数:
              </label>
              <select
                id="translation-batch-size"
                value={batchSize ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value);
                  const key = isClassical ? 'japanese-translation-batch-size' : 'memorization-batch-size';
                  try {
                    if (value === null) {
                      localStorage.removeItem(key);
                    } else {
                      localStorage.setItem(key, String(value));
                    }
                    window.location.reload();
                  } catch {
                    // ignore storage errors
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">制限なし</option>
                <option value="10">10問</option>
                <option value="20">20問</option>
                <option value="30">30問</option>
                <option value="50">50問</option>
                <option value="100">100問</option>
                <option value="200">200問</option>
              </select>
            </div>

            {/* 不正解の上限 */}
            <div>
              <label
                htmlFor="translation-review-ratio-limit"
                className="block text-sm font-medium mb-2 text-gray-700"
              >
                ❌ 不正解の上限:
              </label>
              <select
                id="translation-review-ratio-limit"
                value={reviewRatioLimit}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  const key = isClassical
                    ? 'japanese-translation-review-ratio-limit'
                    : 'memorization-review-ratio-limit';
                  try {
                    localStorage.setItem(key, String(value));
                    window.location.reload();
                  } catch {
                    // ignore storage errors
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="10">10%</option>
                <option value="20">20%</option>
                <option value="30">30%</option>
                <option value="40">40%</option>
                <option value="50">50%</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <div className="w-full max-w-4xl px-4">
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            allQuestions={questions}
            currentIndex={currentIndex}
            answered={answered}
            selectedAnswer={selectedAnswer}
            onAnswer={(answer, correct) => handleAnswer(answer, correct)}
            onNext={handleNextOrSkip}
            onPrevious={handlePrevious}
          />
        </div>
      </div>
    </div>
  );
}

export default SocialStudiesView;
