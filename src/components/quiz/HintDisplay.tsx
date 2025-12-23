/**
 * HintDisplay - ヒント表示コンポーネント
 *
 * **役割**: 段階的ヒント（Scaffolding）を表示
 *
 * **ヒントレベル**:
 * - Level 1: 軽いヒント（最初の文字）💡
 * - Level 2: 中程度のヒント（最初3文字 + 文字数）💡💡
 * - Level 3: 強いヒント（伏せ字）💡💡💡
 *
 * Phase 5: 感情的サポート統合
 */

import React from 'react';
import type { HintLevel } from '../../ai/specialists/scaffolding/ScaffoldingSystem';

interface HintDisplayProps {
  /** ヒントテキスト */
  text: string | null;
  /** ヒントレベル（1-3） */
  level: HintLevel;
  /** 表示するかどうか */
  show?: boolean;
  /** ヒント表示理由 */
  reason?: string;
}

/**
 * ヒント表示コンポーネント
 */
export const HintDisplay: React.FC<HintDisplayProps> = ({
  text,
  level,
  show = true,
  reason
}) => {
  if (!show || level === 0 || !text) {
    return null;
  }

  // レベルごとのスタイル設定
  const levelConfig: Record<1 | 2 | 3, {
    icon: string;
    label: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    intensity: string;
  }> = {
    1: {
      icon: '💡',
      label: '軽いヒント',
      bgColor: 'bg-purple-50/20',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      intensity: 'hint-light'
    },
    2: {
      icon: '💡💡',
      label: '中程度のヒント',
      bgColor: 'bg-indigo-50/20',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-800',
      intensity: 'hint-medium'
    },
    3: {
      icon: '💡💡💡',
      label: '強いヒント',
      bgColor: 'bg-pink-50/20',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-800',
      intensity: 'hint-strong'
    }
  };

  const config = levelConfig[level as 1 | 2 | 3] || levelConfig[1];

  return (
    <div
      className={`
        hint-display
        ${config.intensity}
        ${config.bgColor}
        ${config.borderColor}
        ${config.textColor}
        rounded-lg border-2 p-4 mb-4
        animate-slide-down
      `}
      role="complementary"
      aria-label={`ヒント レベル${level}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden="true">
          {config.icon}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-75">
              {config.label}
            </span>
            {reason && (
              <span className="text-xs opacity-60">
                ({reason})
              </span>
            )}
          </div>
          <p className="text-sm font-medium whitespace-pre-line">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * ヒント要求ボタン
 */
export const HintRequestButton: React.FC<{
  onRequestHint: () => void;
  disabled?: boolean;
  currentLevel: HintLevel;
}> = ({ onRequestHint, disabled = false, currentLevel }) => {
  const buttonText = currentLevel === 0
    ? 'ヒントを見る'
    : `さらにヒントを見る (Lv${currentLevel + 1})`;

  return (
    <button
      onClick={onRequestHint}
      disabled={disabled || currentLevel >= 3}
      className={`
        hint-request-button
        px-4 py-2 rounded-md
        text-sm font-medium
        transition-all
        ${disabled || currentLevel >= 3
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-purple-100/40 text-purple-700 hover:bg-purple-200:bg-purple-900/60'
        }
      `}
      aria-label={buttonText}
    >
      💡 {buttonText}
    </button>
  );
};

/**
 * ヒント進行インジケーター
 */
export const HintProgressIndicator: React.FC<{
  currentLevel: HintLevel;
}> = ({ currentLevel }) => {
  if (currentLevel === 0) return null;

  return (
    <div className="hint-progress flex items-center gap-1 mb-2">
      <span className="text-xs text-gray-500 mr-2">
        ヒント強度:
      </span>
      {[1, 2, 3].map((level) => (
        <div
          key={level}
          className={`
            h-1 w-8 rounded-full
            transition-colors
            ${level <= currentLevel
              ? 'bg-purple-600'
              : 'bg-gray-200'
            }
          `}
          aria-hidden="true"
        />
      ))}
      <span className="text-xs text-gray-600 ml-2">
        Lv{currentLevel}/3
      </span>
    </div>
  );
};
