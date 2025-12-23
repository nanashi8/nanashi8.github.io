/**
 * QuestionVariantCard - 多様な復習方法対応の問題カード
 *
 * **対応する復習方法**:
 * 1. RECOGNITION: 選択肢から意味を選ぶ
 * 2. RECALL: 英語を入力する
 * 3. SENTENCE: 穴埋め問題
 * 4. LISTENING: 音声を聞いて書き取る
 * 5. PRODUCTION: 画像/状況から英語で表現
 *
 * Phase 6: 多様な復習方法統合
 */

import React, { useState } from 'react';
import type { QuestionVariant, ReviewMethod } from '../../ai/specialists/context/ContextRotationSystem';

interface QuestionVariantCardProps {
  /** 問題情報 */
  question: QuestionVariant;
  /** 解答コールバック */
  onAnswer: (answer: string, isCorrect: boolean) => void;
  /** ヒント表示フラグ */
  showHint?: boolean;
}

/**
 * 多様な復習方法対応の問題カード
 */
export const QuestionVariantCard: React.FC<QuestionVariantCardProps> = ({
  question,
  onAnswer,
  showHint = false
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  // 復習方法別のレンダリング
  const renderQuestion = () => {
    switch (question.type) {
      case 'recognition':
        return <RecognitionQuestion question={question} onAnswer={onAnswer} />;
      case 'recall':
        return <RecallQuestion question={question} userAnswer={userAnswer} setUserAnswer={setUserAnswer} onAnswer={onAnswer} />;
      case 'sentence':
        return <SentenceQuestion question={question} userAnswer={userAnswer} setUserAnswer={setUserAnswer} onAnswer={onAnswer} />;
      case 'listening':
        return <ListeningQuestion question={question} userAnswer={userAnswer} setUserAnswer={setUserAnswer} onAnswer={onAnswer} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />;
      case 'production':
        return <ProductionQuestion question={question} userAnswer={userAnswer} setUserAnswer={setUserAnswer} onAnswer={onAnswer} />;
      default:
        return null;
    }
  };

  return (
    <div className="question-variant-card bg-white rounded-lg shadow-lg p-6">
      {/* 問題タイプバッジ */}
      <div className="mb-4">
        <span className={`
          inline-block px-3 py-1 rounded-full text-xs font-semibold
          ${getTypeColor(question.type)}
        `}>
          {getTypeLabel(question.type)}
        </span>
      </div>

      {/* 指示文 */}
      <p className="text-sm text-gray-600 mb-4">
        {question.instruction}
      </p>

      {/* 問題コンテンツ */}
      {renderQuestion()}

      {/* ヒント表示 */}
      {showHint && question.hint && (
        <div className="mt-4 p-3 bg-purple-50/20 rounded-md">
          <p className="text-sm text-purple-700">
            💡 {question.hint}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * 認識テスト（選択肢）
 */
const RecognitionQuestion: React.FC<{
  question: QuestionVariant;
  onAnswer: (answer: string, isCorrect: boolean) => void;
}> = ({ question, onAnswer }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (choice: string) => {
    setSelected(choice);
    const isCorrect = choice === question.answer;
    setTimeout(() => onAnswer(choice, isCorrect), 500);
  };

  return (
    <div>
      {/* 問題文（英単語） */}
      <h2 className="text-3xl font-bold text-center mb-6">
        {question.prompt}
      </h2>

      {/* 選択肢 */}
      <div className="grid grid-cols-1 gap-3">
        {question.choices?.map((choice, index) => (
          <button
            key={index}
            onClick={() => handleSelect(choice)}
            disabled={selected !== null}
            className={`
              p-4 rounded-lg border-2 text-left transition-all
              ${selected === choice
                ? choice === question.answer
                  ? 'border-green-500 bg-green-50/20'
                  : 'border-red-500 bg-red-50/20'
                : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50:bg-blue-900/20'
              }
              ${selected !== null ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * 想起テスト（入力）
 */
const RecallQuestion: React.FC<{
  question: QuestionVariant;
  userAnswer: string;
  setUserAnswer: (value: string) => void;
  onAnswer: (answer: string, isCorrect: boolean) => void;
}> = ({ question, userAnswer, setUserAnswer, onAnswer }) => {
  const handleSubmit = () => {
    const isCorrect = userAnswer.trim().toLowerCase() === question.answer.toLowerCase();
    onAnswer(userAnswer, isCorrect);
  };

  return (
    <div>
      {/* 問題文（日本語） */}
      <h2 className="text-2xl font-bold text-center mb-6">
        {question.prompt}
      </h2>

      {/* 入力フィールド */}
      <div className="flex gap-2">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="英語で入力..."
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!userAnswer.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          解答
        </button>
      </div>
    </div>
  );
};

/**
 * 文脈テスト（穴埋め）
 */
const SentenceQuestion: React.FC<{
  question: QuestionVariant;
  userAnswer: string;
  setUserAnswer: (value: string) => void;
  onAnswer: (answer: string, isCorrect: boolean) => void;
}> = ({ question, userAnswer, setUserAnswer, onAnswer }) => {
  const handleSubmit = () => {
    const isCorrect = userAnswer.trim().toLowerCase() === question.answer.toLowerCase();
    onAnswer(userAnswer, isCorrect);
  };

  return (
    <div>
      {/* 例文（空欄あり） */}
      <div className="mb-6 p-4 bg-gray-50/50 rounded-lg">
        <p className="text-lg leading-relaxed whitespace-pre-line">
          {question.prompt}
        </p>
      </div>

      {/* 入力フィールド */}
      <div className="flex gap-2">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="空欄に入る単語..."
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!userAnswer.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          解答
        </button>
      </div>
    </div>
  );
};

/**
 * 聴覚テスト（音声 → 書き取り）
 */
const ListeningQuestion: React.FC<{
  question: QuestionVariant;
  userAnswer: string;
  setUserAnswer: (value: string) => void;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
}> = ({ question, userAnswer, setUserAnswer, onAnswer, isPlaying, setIsPlaying }) => {
  const playAudio = () => {
    if (question.audioUrl) {
      const audio = new Audio(question.audioUrl);
      setIsPlaying(true);
      audio.play();
      audio.onended = () => setIsPlaying(false);
    }
  };

  const handleSubmit = () => {
    const isCorrect = userAnswer.trim().toLowerCase() === question.answer.toLowerCase();
    onAnswer(userAnswer, isCorrect);
  };

  return (
    <div>
      {/* 音声再生ボタン */}
      <div className="flex justify-center mb-6">
        <button
          onClick={playAudio}
          disabled={isPlaying || !question.audioUrl}
          className={`
            px-8 py-4 rounded-full text-4xl
            ${isPlaying
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            }
            text-white transition-all transform hover:scale-105
          `}
        >
          {isPlaying ? '🔊' : '▶️'}
        </button>
      </div>

      {/* 入力フィールド */}
      <div className="flex gap-2">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="聞こえた単語を入力..."
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
        />
        <button
          onClick={handleSubmit}
          disabled={!userAnswer.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          解答
        </button>
      </div>
    </div>
  );
};

/**
 * 産出テスト（画像 → 英語表現）
 */
const ProductionQuestion: React.FC<{
  question: QuestionVariant;
  userAnswer: string;
  setUserAnswer: (value: string) => void;
  onAnswer: (answer: string, isCorrect: boolean) => void;
}> = ({ question, userAnswer, setUserAnswer, onAnswer }) => {
  const handleSubmit = () => {
    const isCorrect = userAnswer.trim().toLowerCase() === question.answer.toLowerCase();
    onAnswer(userAnswer, isCorrect);
  };

  return (
    <div>
      {/* 画像表示（あれば） */}
      {question.imageUrl && (
        <div className="mb-6 flex justify-center">
          <img
            src={question.imageUrl}
            alt="問題画像"
            className="max-w-md rounded-lg shadow-md"
          />
        </div>
      )}

      {/* 問題文 */}
      <h2 className="text-xl font-bold text-center mb-6">
        {question.prompt}
      </h2>

      {/* 入力フィールド */}
      <div className="flex gap-2">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="英語で表現..."
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!userAnswer.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          解答
        </button>
      </div>
    </div>
  );
};

/**
 * 復習方法タイプの色を取得
 */
function getTypeColor(type: ReviewMethod): string {
  const colors = {
    recognition: 'bg-green-100 text-green-800/30',
    recall: 'bg-blue-100 text-blue-800/30',
    sentence: 'bg-purple-100 text-purple-800/30',
    listening: 'bg-orange-100 text-orange-800/30',
    production: 'bg-pink-100 text-pink-800/30'
  };
  return colors[type] || colors.recognition;
}

/**
 * 復習方法タイプのラベルを取得
 */
function getTypeLabel(type: ReviewMethod): string {
  const labels = {
    recognition: '認識テスト',
    recall: '想起テスト',
    sentence: '文脈テスト',
    listening: '聴覚テスト',
    production: '産出テスト'
  };
  return labels[type] || type;
}
