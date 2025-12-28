/**
 * 社会科学習ビュー
 *
 * 地理・歴史・公民の一問一答形式
 * - 3択 + 「分からない」形式
 * - 詳細解説 + 関連事項表示
 * - 時系列ソート対応（歴史のみ）
 * - いもづる式学習（因果関係・時系列重視）
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { SocialStudiesQuestion, SocialStudiesField } from '@/types/socialStudies';
import {
  updateSocialStudiesProgress,
  getSocialStudiesTermProgress,
} from '@/storage/progress/socialStudiesProgress';
import {
  loadRelationships,
  getRelatedTerms,
  type RelatedTermRecommendation,
} from '@/storage/socialStudiesRelations';

interface SocialStudiesViewProps {
  /** 現在のデータソース */
  dataSource?: string;
}

interface QuizChoice {
  text: string;
  isCorrect: boolean;
}

type SortOrder =
  | 'priority'
  | 'random'
  | 'chronological-asc'
  | 'chronological-desc';

/**
 * 社会科学習ビュー
 */
function SocialStudiesView({ dataSource = 'social-studies-sample' }: SocialStudiesViewProps) {
  // ===== 状態管理 =====
  const [questions, setQuestions] = useState<SocialStudiesQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState<QuizChoice[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // いもづる式学習
  const [relatedTerms, setRelatedTerms] = useState<RelatedTermRecommendation[]>([]);

  // フィルター
  const [selectedField, setSelectedField] = useState<SocialStudiesField | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('priority');

  // ===== データ読み込み =====
  useEffect(() => {
    loadQuestions();
  }, [dataSource]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/data/social-studies/${dataSource}.json`);
      if (!response.ok) {
        throw new Error(`データの読み込みに失敗しました: ${response.statusText}`);
      }

      const data: SocialStudiesQuestion[] = await response.json();
      setQuestions(data);

      // 関連情報を読み込み（いもづる式学習用）
      await loadRelationships(dataSource);

      setLoading(false);
    } catch (err) {
      console.error('社会科データ読み込みエラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      setLoading(false);
    }
  };

  // ===== フィルター・ソート処理 =====
  const filteredQuestions = useMemo(() => {
    let filtered = questions;

    // 分野フィルター
    if (selectedField !== 'all') {
      filtered = filtered.filter((q) => q.relatedFields.includes(selectedField));
    }

    // ソート
    if (sortOrder === 'priority') {
      // 優先順位ソート（Position降順: 苦手な問題を優先）
      filtered = [...filtered].sort((a, b) => {
        const progressA = getSocialStudiesTermProgress(a.term);
        const progressB = getSocialStudiesTermProgress(b.term);

        const posA = progressA?.position ?? 35; // 未学習は中間値
        const posB = progressB?.position ?? 35;

        return posB - posA; // 降順（Positionが高い = 苦手を優先）
      });
    } else if (sortOrder === 'chronological-asc') {
      filtered = [...filtered].sort((a, b) => (a.year || 9999) - (b.year || 9999));
    } else if (sortOrder === 'chronological-desc') {
      filtered = [...filtered].sort((a, b) => (b.year || 0) - (a.year || 0));
    } else {
      // ランダムソート
      filtered = [...filtered].sort(() => Math.random() - 0.5);
    }

    return filtered;
  }, [questions, selectedField, sortOrder]);

  // ===== 選択肢生成 =====
  useEffect(() => {
    if (filteredQuestions.length === 0) return;
    generateChoices();
  }, [currentIndex, filteredQuestions]);

  const generateChoices = () => {
    if (filteredQuestions.length === 0) return;

    const currentQuestion = filteredQuestions[currentIndex];
    const correctAnswer = currentQuestion.term;

    // 選択肢ヒントから誤答を生成
    const hints = currentQuestion.choiceHints.split('|').map((h) => h.trim());
    const incorrectChoices = hints.slice(0, 2); // 最大2つの誤答

    // 選択肢を作成
    const newChoices: QuizChoice[] = [
      { text: correctAnswer, isCorrect: true },
      ...incorrectChoices.map((text) => ({ text, isCorrect: false })),
    ];

    // シャッフル
    newChoices.sort(() => Math.random() - 0.5);

    setChoices(newChoices);
  };

  // ===== 回答処理 =====
  const handleAnswer = (answer: string) => {
    if (isAnswered) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);
    setTotalAnswered(totalAnswered + 1);

    const currentQuestion = filteredQuestions[currentIndex];
    const isCorrect = answer === currentQuestion.term;

    if (isCorrect) {
      setScore(score + 1);
    }

    // 進捗を更新（Position 0-100管理）
    updateSocialStudiesProgress(
      currentQuestion.term,
      currentQuestion.relatedFields.split('|')[0].trim(),
      isCorrect,
      false
    );

    // 関連語句を取得（いもづる式学習）
    const related = getRelatedTerms(currentQuestion.term, 3);
    setRelatedTerms(related);
  };

  const handleDontKnow = () => {
    if (isAnswered) return;

    setSelectedAnswer('分からない');
    setIsAnswered(true);
    setTotalAnswered(totalAnswered + 1);

    const currentQuestion = filteredQuestions[currentIndex];

    // 進捗を更新（「分からない」は不正解として扱う）
    updateSocialStudiesProgress(
      currentQuestion.term,
      currentQuestion.relatedFields.split('|')[0].trim(),
      false,
      true // isDontKnow: true
    );

    // 関連語句を取得（いもづる式学習）
    const related = getRelatedTerms(currentQuestion.term, 3);
    setRelatedTerms(related);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setRelatedTerms([]);
    setCurrentIndex((currentIndex + 1) % filteredQuestions.length);
  };

  // ===== レンダリング =====
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">エラー: {error}</div>
      </div>
    );
  }

  if (filteredQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">問題がありません</div>
      </div>
    );
  }

  const currentQuestion = filteredQuestions[currentIndex];
  const correctRate =
    totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

  return (
    <div className="social-studies-view max-w-4xl mx-auto p-4">
      {/* ヘッダー: スコアとフィルター */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* スコア表示 */}
          <div className="flex items-center gap-4">
            <div className="text-lg font-bold">
              正解率: <span className="text-blue-600">{correctRate}%</span>
            </div>
            <div className="text-sm text-gray-600">
              {score} / {totalAnswered}問正解
            </div>
          </div>

          {/* フィルター */}
          <div className="flex items-center gap-2">
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value as SocialStudiesField | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">全分野</option>
              <optgroup label="歴史">
                <option value="歴史-古代">古代</option>
                <option value="歴史-中世">中世</option>
                <option value="歴史-近世">近世</option>
                <option value="歴史-近代">近代</option>
                <option value="歴史-現代">現代</option>
              </optgroup>
              <optgroup label="地理">
                <option value="地理-日本">日本</option>
                <option value="地理-世界">世界</option>
                <option value="地理-産業">産業</option>
                <option value="地理-環境">環境</option>
              </optgroup>
              <optgroup label="公民">
                <option value="公民-政治">政治</option>
                <option valuepriority">優先順位（苦手優先）</option>
              <option value="="公民-経済">経済</option>
                <option value="公民-国際">国際</option>
                <option value="公民-人権">人権</option>
              </optgroup>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="random">ランダム</option>
              <option value="chronological-asc">時系列（古→新）</option>
              <option value="chronological-desc">時系列（新→古）</option>
            </select>
          </div>
        </div>
      </div>

      {/* 問題カード */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {/* 問題番号と分野 */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            問題 {currentIndex + 1} / {filteredQuestions.length}
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {currentQuestion.relatedFields}
            </span>
            {currentQuestion.year && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                {currentQuestion.year}年
              </span>
            )}
          </div>
        </div>

        {/* 問題文 */}
        <div className="mb-6">
          <p className="text-xl font-bold text-gray-800 mb-2">{currentQuestion.question}</p>
          {currentQuestion.matter && (
            <p className="text-sm text-gray-600">（{currentQuestion.matter}）</p>
          )}
        </div>

        {/* 選択肢 */}
        <div className="space-y-3 mb-6">
          {choices.map((choice, index) => {
            const isSelected = selectedAnswer === choice.text;
            const isCorrect = choice.isCorrect;
            const showResult = isAnswered;

            let buttonClass =
              'w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ';
            if (!showResult) {
              buttonClass += 'border-gray-300 hover:border-blue-500 hover:bg-blue-50';
            } else if (isSelected && isCorrect) {
              buttonClass += 'border-green-500 bg-green-50';
            } else if (isSelected && !isCorrect) {
              buttonClass += 'border-red-500 bg-red-50';
            } else if (isCorrect) {
              buttonClass += 'border-green-500 bg-green-50';
            } else {
              buttonClass += 'border-gray-300 bg-gray-50';
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(choice.text)}
                disabled={isAnswered}
                className={buttonClass}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">{choice.text}</span>
                  {showResult && isCorrect && <span className="text-green-600">✓ 正解</span>}
                  {showResult && isSelected && !isCorrect && (
                    <span className="text-red-600">✗ 不正解</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 「分からない」ボタン */}
        {!isAnswered && (
          <button
            onClick={handleDontKnow}
            className="w-full p-3 border-2 border-gray-400 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200"
          >
            分からない
          </button>
        )}

        {/* 解説表示（回答後） */}
        {isAnswered && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold mb-2 text-gray-800">📝 解説</h3>
            <p className="text-gray-700 mb-4">{currentQuestion.explanation}</p>

            {/* 関連事項 */}
            {currentQuestion.relatedMatters && (
              <div className="mt-4">
                <h4 className="text-sm font-bold text-gray-700 mb-2">🔗 関連事項</h4>
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.relatedMatters.split('|').map((matter, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
                    >
                      {matter.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* いもづる式学習: 推薦関連語句 */}
            {relatedTerms.length > 0 && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="text-sm font-bold text-purple-800 mb-2">
                  🔍 次に学ぶとよい語句
                </h4>
                <div className="space-y-2">
                  {relatedTerms.map((rec, idx) => {
                    const progress = getSocialStudiesTermProgress(rec.term);
                    const positionBadge = progress
                      ? progress.position <= 20
                        ? '✅ 習得済み'
                        : progress.position <= 40
                          ? '📚 定着中'
                          : progress.position <= 70
                            ? '📖 学習中'
                            : '❓ 苦手'
                      : '🆕 未学習';

                    return (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-2 bg-white rounded border border-purple-100"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-purple-900">{rec.term}</span>
                            <span className="text-xs text-purple-600">{positionBadge}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{rec.reason}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  💡 ヒント: これらの語句を学習すると、理解が深まります
                </p>
              </div>
            )}
                  ))}
                </div>
              </div>
            )}

            {/* 次へボタン */}
            <button
              onClick={handleNext}
              className="mt-6 w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              次の問題へ →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SocialStudiesView;
