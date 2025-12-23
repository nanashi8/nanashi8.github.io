/**
 * EncouragementDisplay - 励ましメッセージ表示コンポーネント
 *
 * **役割**: 学習者の状況に応じた励ましメッセージを表示
 *
 * **メッセージタイプ**:
 * - support: 挫折時のサポート 💪
 * - praise: 好調時の称賛 🎉
 * - mastery: マスター達成時 ⭐
 * - standard: 通常時 📝
 *
 * Phase 5: 感情的サポート統合
 */

import React from 'react';
import type { EncouragementType } from '../../ai/specialists/EmotionalAI';

interface EncouragementDisplayProps {
  /** 励ましメッセージ */
  message: string;
  /** メッセージタイプ */
  type: EncouragementType;
  /** 表示するかどうか */
  show?: boolean;
}

/**
 * 励ましメッセージ表示コンポーネント
 */
export const EncouragementDisplay: React.FC<EncouragementDisplayProps> = ({
  message,
  type,
  show = true
}) => {
  if (!show || !message) {
    return null;
  }

  // タイプごとのアイコンとスタイル
  const config = {
    support: {
      icon: '💪',
      className: 'encouragement-support',
      bgColor: 'bg-blue-50/20',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800'
    },
    praise: {
      icon: '🎉',
      className: 'encouragement-praise',
      bgColor: 'bg-green-50/20',
      borderColor: 'border-green-200',
      textColor: 'text-green-800'
    },
    mastery: {
      icon: '⭐',
      className: 'encouragement-mastery',
      bgColor: 'bg-yellow-50/20',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800'
    },
    standard: {
      icon: '📝',
      className: 'encouragement-standard',
      bgColor: 'bg-gray-50/20',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800'
    }
  }[type];

  return (
    <div
      className={`
        encouragement
        ${config.className}
        ${config.bgColor}
        ${config.borderColor}
        ${config.textColor}
        rounded-lg border-2 p-4 mb-4
        animate-fade-in
        flex items-start gap-3
      `}
      role="status"
      aria-live="polite"
    >
      <span className="text-2xl" aria-hidden="true">
        {config.icon}
      </span>
      <p className="flex-1 text-sm font-medium leading-relaxed">
        {message}
      </p>
    </div>
  );
};

/**
 * 休憩提案メッセージ
 */
export const BreakSuggestion: React.FC<{
  show: boolean;
  onTakeBreak?: () => void;
  onContinue?: () => void;
}> = ({ show, onTakeBreak, onContinue }) => {
  if (!show) return null;

  return (
    <div
      className="
        break-suggestion
        bg-orange-50/20
        border-2 border-orange-200
        text-orange-800
        rounded-lg p-4 mb-4
        animate-fade-in
      "
      role="alert"
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl" aria-hidden="true">
          😴
        </span>
        <div className="flex-1">
          <h3 className="font-bold text-base mb-1">
            少し休憩しませんか？
          </h3>
          <p className="text-sm">
            頑張っていますね！集中力を保つために、短い休憩をおすすめします。
          </p>
        </div>
      </div>

      <div className="flex gap-2 ml-11">
        {onTakeBreak && (
          <button
            onClick={onTakeBreak}
            className="
              px-4 py-2 rounded-md
              bg-orange-600 text-white
              hover:bg-orange-700
              transition-colors
              text-sm font-medium
            "
          >
            休憩する（5分）
          </button>
        )}
        {onContinue && (
          <button
            onClick={onContinue}
            className="
              px-4 py-2 rounded-md
              bg-white
              border border-orange-200
              text-orange-800
              hover:bg-orange-50:bg-orange-900/40
              transition-colors
              text-sm font-medium
            "
          >
            続ける
          </button>
        )}
      </div>
    </div>
  );
};
