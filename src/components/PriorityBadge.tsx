/**
 * Priority Badge Component
 *
 * 優先度バッジ＋説明を表示するコンポーネント
 */

import React, { useState } from 'react';
import {
  explainPriority,
  getPriorityColor,
  getPriorityLabel,
  // type PriorityExplanation,
} from '@/ai/explainability/priorityExplanation';
import type { WordProgress } from '@/storage/progress/types';

interface PriorityBadgeProps {
  /** 単語の進捗情報 */
  progress: WordProgress;
  /** コンパクト表示（バッジのみ） */
  compact?: boolean;
  /** クリック時に詳細を表示するか */
  expandable?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  progress,
  compact = false,
  expandable = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const explanation = explainPriority(progress);
  const colorClass = getPriorityColor(explanation.priority);
  const label = getPriorityLabel(explanation.priority);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colorClass} ${expandable ? 'cursor-pointer hover:opacity-80' : ''}`}
        onClick={expandable ? () => setIsExpanded(!isExpanded) : undefined}
        title={expandable ? 'クリックで詳細表示' : undefined}
      >
        <span>{explanation.factors[0].icon}</span>
        <span>{label}</span>
        <span className="font-bold">{explanation.priority.toFixed(0)}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* バッジヘッダー */}
      <div
        className={`flex items-center justify-between p-3 rounded-lg border ${colorClass} ${expandable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        onClick={expandable ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{explanation.factors[0].icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{label}</span>
              <span className="text-xs opacity-70">優先度 {explanation.priority.toFixed(0)}</span>
            </div>
            <p className="text-xs mt-1 opacity-80">{explanation.mainReason}</p>
          </div>
        </div>
        {expandable && (
          <button className={`text-lg transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
            ▼
          </button>
        )}
      </div>

      {/* 詳細（展開時） */}
      {isExpanded && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* ユーザーメッセージ */}
          <div className="p-3 bg-blue-50/20 rounded border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">
              💬 {explanation.userMessage}
            </p>
          </div>

          {/* 要因リスト */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-2">
              優先度の内訳
            </h4>
            <div className="space-y-2">
              {explanation.factors.map((factor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{factor.icon}</span>
                    <div>
                      <span className="text-sm font-medium text-gray-800">
                        {factor.name}
                      </span>
                      <p className="text-xs text-gray-600">
                        {factor.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    +{factor.impact.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 推奨アクション */}
          <div className="p-3 bg-green-50/20 rounded border border-green-200">
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <div>
                <h4 className="text-sm font-bold text-green-800 mb-1">
                  推奨アクション
                </h4>
                <p className="text-xs text-green-700">
                  {explanation.recommendedAction}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 優先度説明のモーダル（独立表示用）
 */
interface PriorityExplanationModalProps {
  progress: WordProgress;
  onClose: () => void;
}

export const PriorityExplanationModal: React.FC<PriorityExplanationModalProps> = ({
  progress,
  onClose,
}) => {
  const _explanation = explainPriority(progress);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            優先度の説明
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          <PriorityBadge progress={progress} compact={false} expandable={false} />
        </div>
      </div>
    </div>
  );
};
