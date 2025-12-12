import { useState, useEffect, useMemo } from 'react';
import { QuestionSet } from '../types';
import { saveQuestionSets, deleteQuestionSet, generateId, parseCSV } from '../utils';

interface QuestionEditorViewProps {
  questionSets: QuestionSet[];
  onQuestionSetsChange: (sets: QuestionSet[]) => void;
  onLoadCSV: (filePath: string) => void;
  onLoadLocalFile: (file: File) => void;
  autoAdvance: boolean;
  onAutoAdvanceChange: (value: boolean) => void;
  autoAdvanceDelay: number;
  onAutoAdvanceDelayChange: (value: number) => void;
  adaptiveMode?: boolean;
  onAdaptiveModeChange?: (value: boolean) => void;
}

function QuestionEditorView({
  questionSets,
  onQuestionSetsChange,
  onLoadCSV: _onLoadCSV,
  onLoadLocalFile: _onLoadLocalFile,
  autoAdvance,
  onAutoAdvanceChange,
  autoAdvanceDelay,
  onAutoAdvanceDelayChange,
  adaptiveMode,
  onAdaptiveModeChange,
}: QuestionEditorViewProps) {
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);

  // 最初の問題集を選択
  useEffect(() => {
    if (questionSets.length > 0 && !selectedSetId) {
      setSelectedSetId(questionSets[0].id);
    }
  }, [questionSets, selectedSetId]);

  // 問題集が変更されたら保存
  useEffect(() => {
    if (questionSets.length > 0) {
      saveQuestionSets(questionSets);
    }
  }, [questionSets]);

  const currentSet = questionSets.find((s) => s.id === selectedSetId);

  // 統計情報
  const stats = useMemo(() => {
    if (!currentSet) return null;

    const difficulties: Record<string, number> = {};
    const categories: Record<string, number> = {};

    currentSet.questions.forEach((q) => {
      difficulties[q.difficulty || '未分類'] = (difficulties[q.difficulty || '未分類'] || 0) + 1;
      categories[q.category || '未分類'] = (categories[q.category || '未分類'] || 0) + 1;
    });

    return {
      total: currentSet.questions.length,
      difficulties,
      categories,
    };
  }, [currentSet]);

  // 問題集を追加
  const handleAddQuestionSet = () => {
    const name = prompt('新しい問題集の名前を入力:');
    if (!name) return;

    const newSet: QuestionSet = {
      id: generateId(),
      name,
      questions: [],
      createdAt: Date.now(),
      isBuiltIn: false,
      source: '手動作成',
    };

    onQuestionSetsChange([...questionSets, newSet]);
    setSelectedSetId(newSet.id);
  };

  // 問題集を削除
  const handleDeleteQuestionSet = (id: string) => {
    const set = questionSets.find((s) => s.id === id);
    if (!set) return;

    if (set.isBuiltIn) {
      alert('組み込みの問題集は削除できません');
      return;
    }

    if (!confirm(`問題集「${set.name}」を削除しますか？`)) return;

    deleteQuestionSet(id);
    onQuestionSetsChange(questionSets.filter((s) => s.id !== id));
    if (selectedSetId === id) {
      setSelectedSetId(questionSets[0]?.id || null);
    }
  };

  // 問題集名を変更
  const handleRenameQuestionSet = (id: string) => {
    const set = questionSets.find((s) => s.id === id);
    if (!set || set.isBuiltIn) return;

    const newName = prompt('新しい名前を入力:', set.name);
    if (!newName) return;

    onQuestionSetsChange(questionSets.map((s) => (s.id === id ? { ...s, name: newName } : s)));
  };

  // CSV インポート
  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const text = ev.target?.result as string;
          const questions = parseCSV(text);

          if (questions.length === 0) {
            alert('問題が見つかりませんでした');
            return;
          }

          const setName = prompt('問題集の名前を入力:', file.name.replace('.csv', ''));
          if (!setName) return;

          const newSet: QuestionSet = {
            id: generateId(),
            name: setName,
            questions,
            createdAt: Date.now(),
            isBuiltIn: false,
            source: 'CSV インポート',
          };

          onQuestionSetsChange([...questionSets, newSet]);
          setSelectedSetId(newSet.id);
          alert(`${questions.length}個の問題をインポートしました`);
        } catch (_error) {
          alert('CSVの読み込みに失敗しました');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // CSVサンプルダウンロード
  const handleDownloadSample = () => {
    const sampleCSV = `語句,読み,意味,語源等解説,関連語,関連分野,難易度
apple,アップル,りんご,ラテン語の malus から,fruit,食べ物,初級
cat,キャット,ねこ,古英語の catt から,animal,動物,初級
book,ブック,本,古英語の bōc から,reading,学習,初級`;

    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sample-questions.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="question-editor-view">
      <h2>📝 問題設定</h2>

      {/* 基本設定セクション */}
      <div className="settings-section">
        <h3>⚙️ 基本設定</h3>
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => onAutoAdvanceChange(e.target.checked)}
              className="setting-checkbox"
            />
            <span className="setting-text">正解したら自動で次の問題へ進む</span>
          </label>
          {autoAdvance && (
            <div className="setting-sub-item">
              <label className="setting-sub-label">
                <span className="setting-sub-text">進むまでの時間:</span>
                <select
                  value={autoAdvanceDelay}
                  onChange={(e) => onAutoAdvanceDelayChange(Number(e.target.value))}
                  className="setting-select"
                >
                  <option value={0.5}>0.5秒</option>
                  <option value={1.0}>1.0秒</option>
                  <option value={1.5}>1.5秒</option>
                </select>
              </label>
            </div>
          )}
          <p className="setting-hint">
            オンにすると、正解時に選択した時間後に自動で次の問題へ進みます
          </p>
        </div>

        {onAdaptiveModeChange && (
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={adaptiveMode || false}
                onChange={(e) => onAdaptiveModeChange(e.target.checked)}
                className="setting-checkbox"
              />
              <span className="setting-text">適応的学習モード</span>
            </label>
            <p className="setting-hint">
              学習履歴に基づいて出題順を最適化します（新規30%・復習50%・定着済み20%）
            </p>
          </div>
        )}
      </div>

      {/* CSV管理セクション */}
      <div className="csv-management-section">
        <h3>📄 CSV形式で問題集を管理</h3>
        <div className="csv-actions">
          <button onClick={handleDownloadSample} className="btn-secondary">
            📥 サンプルCSVをダウンロード
          </button>
          <button onClick={handleImportCSV} className="btn-primary">
            📂 CSVファイルから問題集を追加
          </button>
        </div>
        <p className="csv-hint">
          💡 サンプルCSVをダウンロードして編集後、「CSVファイルから問題集を追加」で読み込めます
        </p>
      </div>

      <div className="editor-layout">
        {/* 左サイドバー: 問題集一覧 */}
        <div className="editor-sidebar">
          <div className="sidebar-header">
            <h3>問題集一覧</h3>
            <div className="sidebar-actions">
              <button onClick={handleAddQuestionSet} className="btn-icon" title="新規作成">
                ➕
              </button>
              <button onClick={handleImportCSV} className="btn-icon" title="CSV インポート">
                📂
              </button>
            </div>
          </div>

          <div className="question-sets-list">
            {questionSets.length === 0 ? (
              <p className="empty-message">問題集がありません</p>
            ) : (
              questionSets.map((set) => (
                <div
                  key={set.id}
                  className={`set-item ${selectedSetId === set.id ? 'active' : ''}`}
                >
                  <button
                    className="w-full px-4 py-3 text-left text-base font-medium bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-lg transition-all duration-200 hover:bg-gray-200 hover:border-gray-400 hover:shadow-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500"
                    onClick={() => setSelectedSetId(set.id)}
                  >
                    <div className="set-name">{set.name}</div>
                    <div className="set-info">{set.questions.length}問</div>
                  </button>
                  <div className="set-actions">
                    {!set.isBuiltIn && (
                      <>
                        <button
                          onClick={() => handleRenameQuestionSet(set.id)}
                          className="btn-icon-small"
                          title="名前変更"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteQuestionSet(set.id)}
                          className="btn-icon-small"
                          title="削除"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* メインエリア: 問題リストと編集 */}
        <div className="editor-main">
          {!currentSet ? (
            <div className="empty-state">
              <p>問題集を選択してください</p>
            </div>
          ) : (
            <>
              {/* ツールバー */}
              <div className="editor-toolbar">
                <div className="toolbar-left">
                  <h3>{currentSet.name}</h3>
                  {stats && <span className="stats-badge">{stats.total}問</span>}
                </div>
              </div>

              {/* 統計情報の表示 */}
              {stats && (
                <div className="editor-stats-summary">
                  <h4>📊 問題集の統計</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-label">総問題数</div>
                      <div className="stat-value">{stats.total}問</div>
                    </div>
                    <div className="stat-section">
                      <div className="stat-label">難易度別</div>
                      <div className="stat-breakdown">
                        {Object.entries(stats.difficulties).map(([level, count]) => (
                          <div key={level} className="stat-breakdown-item">
                            <span>{level}:</span>
                            <span>{count}問</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="stat-section">
                      <div className="stat-label">関連分野別</div>
                      <div className="stat-breakdown">
                        {Object.entries(stats.categories).map(([cat, count]) => (
                          <div key={cat} className="stat-breakdown-item">
                            <span>{cat}:</span>
                            <span>{count}問</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="stats-note">
                    💡
                    問題の編集が必要な場合は、CSVファイルをエクスポートして編集後、再度インポートしてください。
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionEditorView;
