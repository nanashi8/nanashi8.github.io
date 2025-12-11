import React, { useState } from 'react';
import type { CustomQuestionSet, CustomWord } from '../types/customQuestions';

interface FloatingPanelProps {
  /** 表示/非表示の状態 */
  isOpen: boolean;
  /** 閉じる時のコールバック */
  onClose: () => void;
  /** すべてのカスタム問題セット */
  sets: CustomQuestionSet[];
  /** 新しいセットを作成 */
  onCreateSet: (name: string, description?: string) => void;
  /** セットを削除 */
  onDeleteSet: (setId: string) => void;
  /** セット名を編集 */
  onEditSet: (setId: string, name: string, description?: string) => void;
  /** 単語をセットから削除 */
  onRemoveWord: (setId: string, word: CustomWord) => void;
}

/**
 * カスタム問題セット管理用のフローティングパネル
 */
const FloatingPanel: React.FC<FloatingPanelProps> = ({
  isOpen,
  onClose,
  sets,
  onCreateSet,
  onDeleteSet,
  onEditSet,
  onRemoveWord,
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'create'>('manage');
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  if (!isOpen) return null;

  const handleCreateSet = () => {
    if (newSetName.trim()) {
      onCreateSet(newSetName.trim(), newSetDescription.trim() || undefined);
      setNewSetName('');
      setNewSetDescription('');
      setActiveTab('manage');
    }
  };

  const handleStartEdit = (set: CustomQuestionSet) => {
    setEditingSetId(set.id);
    setEditName(set.name);
    setEditDescription(set.description || '');
  };

  const handleSaveEdit = () => {
    if (editingSetId && editName.trim()) {
      onEditSet(editingSetId, editName.trim(), editDescription.trim() || undefined);
      setEditingSetId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingSetId(null);
    setEditName('');
    setEditDescription('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl sm:max-w-4xl w-full mx-auto max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            📚 カスタム問題セット管理
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 px-6 py-3 font-medium ${
              activeTab === 'manage'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            📋 セット管理 ({sets.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 px-6 py-3 font-medium ${
              activeTab === 'create'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            ➕ 新規作成
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'manage' ? (
            <div className="space-y-4">
              {sets.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">📝 まだセットがありません</p>
                  <p className="text-sm">「新規作成」タブから最初のセットを作りましょう</p>
                </div>
              ) : (
                sets.map((set) => (
                  <div
                    key={set.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    {/* セットヘッダー */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4">
                      {editingSetId === set.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="セット名"
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="説明（任意）"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                              保存
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{set.icon || '📖'}</span>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {set.name}
                              </h3>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({set.words.length}語)
                              </span>
                            </div>
                            {set.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {set.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              作成: {new Date(set.createdAt).toLocaleDateString('ja-JP')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStartEdit(set)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                              aria-label="編集"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setExpandedSetId(expandedSetId === set.id ? null : set.id)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                              aria-label={expandedSetId === set.id ? '折りたたむ' : '展開'}
                            >
                              {expandedSetId === set.id ? '▲' : '▼'}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`「${set.name}」を削除しますか？`)) {
                                  onDeleteSet(set.id);
                                }
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                              aria-label="削除"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 単語リスト */}
                    {expandedSetId === set.id && (
                      <div className="p-4 bg-white dark:bg-gray-800">
                        {set.words.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            まだ単語が追加されていません
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {set.words.map((word, index) => (
                              <div
                                key={`${word.word}-${index}`}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {word.word}
                                    </span>
                                    {word.ipa && (
                                      <span className="text-sm text-blue-600 dark:text-blue-400">
                                        /{word.ipa}/
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                    {word.meaning}
                                  </p>
                                  {word.source && (
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                      出典: {word.source}
                                      {word.sourceDetail && ` (${word.sourceDetail})`}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => onRemoveWord(set.id, word)}
                                  className="ml-4 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                  aria-label="削除"
                                >
                                  ➖
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    セット名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="例: 苦手な前置詞"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    説明（任意）
                  </label>
                  <textarea
                    value={newSetDescription}
                    onChange={(e) => setNewSetDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="例: 高校入試でよく出る前置詞をまとめたセット"
                    rows={3}
                  />
                </div>
                <button
                  onClick={handleCreateSet}
                  disabled={!newSetName.trim()}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed font-medium"
                >
                  ➕ セットを作成
                </button>
              </div>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">💡 ヒント</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• セットを作成後、各タブの+ボタンで単語を追加できます</li>
                  <li>• セット名は後から編集できます</li>
                  <li>• 複数のセットを作って、テーマごとに整理しましょう</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloatingPanel;
