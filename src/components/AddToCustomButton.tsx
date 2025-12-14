import React, { useState } from 'react';
import type { CustomWord, CustomQuestionSet } from '../types/customQuestions';

interface AddToCustomButtonProps {
  /** 追加する単語/熟語 */
  word: CustomWord;
  /** すべてのカスタム問題セット */
  sets: CustomQuestionSet[];
  /** 単語を追加 */
  onAddWord: (setId: string, word: CustomWord) => void;
  /** 単語を削除 */
  onRemoveWord: (setId: string, word: CustomWord) => void;
  /** セット管理画面を開く */
  onOpenManagement: () => void;
  /** ボタンのサイズ */
  size?: 'small' | 'medium' | 'large';
  /** ボタンのスタイル */
  variant?: 'icon' | 'text' | 'both';
}

/**
 * カスタム問題セットに単語を追加/削除するボタン
 */
const AddToCustomButton: React.FC<AddToCustomButtonProps> = ({
  word,
  sets,
  onAddWord,
  onRemoveWord,
  onOpenManagement,
  size = 'medium',
  variant = 'icon',
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // この単語が既に追加されているセットを検索
  const containingSets = sets.filter((set) => set.words.some((w) => w.word === word.word));

  const isInAnySet = containingSets.length > 0;

  // サイズに応じたクラス
  const sizeClasses = {
    small: 'text-sm px-2 py-1',
    medium: 'text-base px-3 py-1.5',
    large: 'text-lg px-4 py-2',
  };

  const iconSizeClasses = {
    small: 'text-base',
    medium: 'text-lg',
    large: 'text-xl',
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (sets.length === 0) {
      // セットがない場合は管理画面を開く
      onOpenManagement();
      return;
    }

    if (sets.length === 1) {
      // セットが1つだけの場合は直接追加/削除
      const set = sets[0];
      if (isInAnySet) {
        onRemoveWord(set.id, word);
      } else {
        onAddWord(set.id, word);
      }
    } else {
      // 複数セットがある場合はメニューを表示
      setShowMenu(!showMenu);
    }
  };

  const handleSelectSet = (setId: string, isInSet: boolean) => {
    if (isInSet) {
      onRemoveWord(setId, word);
    } else {
      onAddWord(setId, word);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleToggle}
        className={`
          ${sizeClasses[size]}
          ${
            isInAnySet
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }
          rounded-md font-medium transition-colors duration-200
          flex items-center gap-1
        `}
        title={isInAnySet ? `${containingSets.length}個のセットに追加済み` : 'カスタムセットに追加'}
      >
        <span className={iconSizeClasses[size]}>{isInAnySet ? '✓' : '+'}</span>
        {variant !== 'icon' && <span>{isInAnySet ? '追加済み' : '追加'}</span>}
      </button>

      {/* セット選択メニュー */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
            <div className="p-2 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">セットを選択</p>
            </div>
            <div className="p-2">
              {sets.map((set) => {
                const isInThisSet = set.words.some((w) => w.word === word.word);
                return (
                  <button
                    key={set.id}
                    onClick={() => {
                      handleSelectSet(set.id, isInThisSet);
                      setShowMenu(false);
                    }}
                    className={`
                      w-full text-left px-3 py-2 rounded-md mb-1
                      flex items-center justify-between
                      ${
                        isInThisSet
                          ? 'bg-green-50 text-green-700'
                          : 'hover:bg-gray-100:bg-gray-700 text-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span>{set.icon || '📖'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{set.name}</p>
                        <p className="text-xs text-gray-500">{set.words.length}語</p>
                      </div>
                    </div>
                    <span className="text-lg ml-2">{isInThisSet ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenManagement();
                }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100:bg-gray-700 text-blue-600 text-sm font-medium"
              >
                ➕ 新しいセットを作成
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AddToCustomButton;
