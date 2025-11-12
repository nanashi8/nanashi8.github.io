import { useState, useEffect, useMemo } from 'react';
import { Question, QuestionSet } from '../types';
import {
  saveQuestionSets,
  deleteQuestionSet,
  generateId,
  parseCSV,
  downloadQuestionSetCSV,
} from '../utils';

interface QuestionEditorViewProps {
  questionSets: QuestionSet[];
  onQuestionSetsChange: (sets: QuestionSet[]) => void;
  onLoadCSV: (filePath: string) => void;
  onLoadLocalFile: (file: File) => void;
}

function QuestionEditorView({
  questionSets,
  onQuestionSetsChange,
  onLoadCSV: _onLoadCSV,
  onLoadLocalFile: _onLoadLocalFile,
}: QuestionEditorViewProps) {
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());

  // フィルタ・検索・ソート
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'word' | 'difficulty' | 'date'>('word');

  // 初回読み込みは不要（親から受け取る）
  // useEffect(() => {
  //   const sets = loadQuestionSets();
  //   onQuestionSetsChange(sets);
  //   if (sets.length > 0) {
  //     setSelectedSetId(sets[0].id);
  //   }
  // }, []);

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

  // フィルタリング・ソート済みの問題リスト
  const filteredQuestions = useMemo(() => {
    if (!currentSet) return [];

    let filtered = currentSet.questions.filter((q) => {
      // 検索フィルタ
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !q.word.toLowerCase().includes(query) &&
          !q.meaning.toLowerCase().includes(query) &&
          !q.reading.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // 難易度フィルタ
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) {
        return false;
      }

      // カテゴリフィルタ
      if (categoryFilter !== 'all' && q.relatedFields !== categoryFilter) {
        return false;
      }

      return true;
    });

    // ソート
    filtered.sort((a, b) => {
      if (sortBy === 'word') {
        return a.word.localeCompare(b.word);
      } else if (sortBy === 'difficulty') {
        const diffOrder = ['初級', '中級', '上級', '専門', ''];
        return diffOrder.indexOf(a.difficulty) - diffOrder.indexOf(b.difficulty);
      } else {
        // date は createdAt がないので単語順にフォールバック
        return a.word.localeCompare(b.word);
      }
    });

    return filtered;
  }, [currentSet, searchQuery, difficultyFilter, categoryFilter, sortBy]);

  // 統計情報
  const stats = useMemo(() => {
    if (!currentSet) return null;

    const difficulties: Record<string, number> = {};
    const categories: Record<string, number> = {};

    currentSet.questions.forEach((q) => {
      difficulties[q.difficulty || '未分類'] = (difficulties[q.difficulty || '未分類'] || 0) + 1;
      categories[q.relatedFields || '未分類'] = (categories[q.relatedFields || '未分類'] || 0) + 1;
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

    onQuestionSetsChange(
      questionSets.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
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
        } catch (error) {
          alert('CSVの読み込みに失敗しました');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // CSV エクスポート
  const handleExportCSV = () => {
    if (!currentSet) return;
    downloadQuestionSetCSV(currentSet);
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

  // 問題を追加
  const handleAddQuestion = (question: Question) => {
    if (!currentSet) return;

    // 重複チェック
    const duplicate = currentSet.questions.find((q) => q.word === question.word);
    if (duplicate && !confirm('同じ単語が既に存在します。追加しますか？')) {
      return;
    }

    onQuestionSetsChange(
      questionSets.map((s) =>
        s.id === currentSet.id
          ? { ...s, questions: [...s.questions, question] }
          : s
      )
    );

    setIsAddingNew(false);
    setEditingQuestion(null);
  };

  // 問題を更新
  const handleUpdateQuestion = (index: number, question: Question) => {
    if (!currentSet) return;

    onQuestionSetsChange(
      questionSets.map((s) =>
        s.id === currentSet.id
          ? {
              ...s,
              questions: s.questions.map((q, i) => (i === index ? question : q)),
            }
          : s
      )
    );

    setEditingQuestion(null);
  };

  // 問題を削除
  const handleDeleteQuestion = (index: number) => {
    if (!currentSet || !confirm('この問題を削除しますか？')) return;

    onQuestionSetsChange(
      questionSets.map((s) =>
        s.id === currentSet.id
          ? { ...s, questions: s.questions.filter((_, i) => i !== index) }
          : s
      )
    );
  };

  // 選択した問題を一括削除
  const handleDeleteSelected = () => {
    if (!currentSet || selectedQuestions.size === 0) return;
    if (!confirm(`${selectedQuestions.size}個の問題を削除しますか？`)) return;

    onQuestionSetsChange(
      questionSets.map((s) =>
        s.id === currentSet.id
          ? {
              ...s,
              questions: s.questions.filter((_, i) => !selectedQuestions.has(i)),
            }
          : s
      )
    );

    setSelectedQuestions(new Set());
  };

  // 問題選択トグル
  const toggleQuestionSelection = (index: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedQuestions(newSelected);
  };

  // 全選択/全解除
  const toggleSelectAll = () => {
    if (selectedQuestions.size === filteredQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(
        new Set(filteredQuestions.map((_, i) => i))
      );
    }
  };

  return (
    <div className="question-editor-view">
      <h2>📝 問題設定</h2>

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
          {currentSet && (
            <button onClick={handleExportCSV} className="btn-secondary">
              💾 「{currentSet.name}」をCSVで保存
            </button>
          )}
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
                    className="set-name-btn"
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
                  {stats && (
                    <span className="stats-badge">
                      {stats.total}問 | 選択: {selectedQuestions.size}
                    </span>
                  )}
                </div>
                <div className="toolbar-right">
                  <button onClick={() => setIsAddingNew(true)} className="btn-toolbar">
                    ➕ 問題追加
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="btn-toolbar"
                    disabled={selectedQuestions.size === 0}
                  >
                    🗑️ 選択削除
                  </button>
                  <button onClick={handleExportCSV} className="btn-toolbar">
                    💾 CSV 出力
                  </button>
                </div>
              </div>

              {/* 統計情報 */}
              {stats && (
                <div className="stats-panel">
                  <div className="stat-item">
                    <strong>難易度:</strong>
                    {Object.entries(stats.difficulties).map(([diff, count]) => (
                      <span key={diff} className="stat-badge">
                        {diff}: {count}
                      </span>
                    ))}
                  </div>
                  <div className="stat-item">
                    <strong>カテゴリ:</strong>
                    {Object.entries(stats.categories).map(([cat, count]) => (
                      <span key={cat} className="stat-badge">
                        {cat}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* フィルタ・検索・ソート */}
              <div className="filter-panel">
                <input
                  type="text"
                  placeholder="🔍 検索 (単語・意味・読み)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="filter-select"
                  aria-label="難易度でフィルタ"
                >
                  <option value="all">すべての難易度</option>
                  <option value="初級">初級</option>
                  <option value="中級">中級</option>
                  <option value="上級">上級</option>
                  <option value="専門">専門</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="filter-select"
                  aria-label="カテゴリでフィルタ"
                >
                  <option value="all">すべてのカテゴリ</option>
                  {stats &&
                    Object.keys(stats.categories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="filter-select"
                  aria-label="並び替え"
                >
                  <option value="word">単語順</option>
                  <option value="difficulty">難易度順</option>
                </select>
                <button onClick={toggleSelectAll} className="btn-toolbar">
                  {selectedQuestions.size === filteredQuestions.length
                    ? '全解除'
                    : '全選択'}
                </button>
              </div>

              {/* 問題追加/編集フォーム */}
              {(isAddingNew || editingQuestion) && (
                <QuestionForm
                  question={editingQuestion}
                  onSave={(q) =>
                    editingQuestion
                      ? handleUpdateQuestion(
                          currentSet.questions.indexOf(editingQuestion),
                          q
                        )
                      : handleAddQuestion(q)
                  }
                  onCancel={() => {
                    setIsAddingNew(false);
                    setEditingQuestion(null);
                  }}
                />
              )}

              {/* 問題リスト */}
              <div className="questions-list">
                {filteredQuestions.length === 0 ? (
                  <p className="empty-message">問題がありません</p>
                ) : (
                  filteredQuestions.map((question, index) => (
                    <div key={index} className="question-item">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.has(index)}
                        onChange={() => toggleQuestionSelection(index)}
                        className="question-checkbox"
                        aria-label={`${question.word}を選択`}
                      />
                      <div className="question-content">
                        <div className="question-main">
                          <strong className="question-word">{question.word}</strong>
                          <span className="question-reading">({question.reading})</span>
                          <span className="question-meaning">= {question.meaning}</span>
                        </div>
                        <div className="question-meta">
                          {question.difficulty && (
                            <span className="meta-badge">{question.difficulty}</span>
                          )}
                          {question.relatedFields && (
                            <span className="meta-badge">{question.relatedFields}</span>
                          )}
                        </div>
                      </div>
                      <div className="question-actions">
                        <button
                          onClick={() => setEditingQuestion(question)}
                          className="btn-icon-small"
                          title="編集"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(index)}
                          className="btn-icon-small"
                          title="削除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 問題追加/編集フォーム
function QuestionForm({
  question,
  onSave,
  onCancel,
}: {
  question: Question | null;
  onSave: (q: Question) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Question>(
    question || {
      word: '',
      reading: '',
      meaning: '',
      etymology: '',
      relatedWords: '',
      relatedFields: '',
      difficulty: '',
      hint: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.word.trim() || !formData.meaning.trim()) {
      alert('単語と意味は必須です');
      return;
    }

    onSave({ ...formData, hint: formData.relatedFields || formData.etymology });
  };

  return (
    <div className="question-form">
      <h4>{question ? '問題を編集' : '問題を追加'}</h4>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>
              単語 <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.word}
              onChange={(e) => setFormData({ ...formData, word: e.target.value })}
              placeholder="例: apple"
              required
            />
          </div>
          <div className="form-group">
            <label>読み</label>
            <input
              type="text"
              value={formData.reading}
              onChange={(e) => setFormData({ ...formData, reading: e.target.value })}
              placeholder="例: アップル"
            />
          </div>
        </div>

        <div className="form-group">
          <label>
            意味 <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.meaning}
            onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
            placeholder="例: りんご"
            required
          />
        </div>

        <div className="form-group">
          <label>語源・解説</label>
          <textarea
            value={formData.etymology}
            onChange={(e) => setFormData({ ...formData, etymology: e.target.value })}
            placeholder="例: 古英語 æppel に由来"
            rows={2}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>関連語</label>
            <input
              type="text"
              value={formData.relatedWords}
              onChange={(e) =>
                setFormData({ ...formData, relatedWords: e.target.value })
              }
              placeholder="例: fruit, orange"
            />
          </div>
          <div className="form-group">
            <label>カテゴリ</label>
            <input
              type="text"
              value={formData.relatedFields}
              onChange={(e) =>
                setFormData({ ...formData, relatedFields: e.target.value })
              }
              placeholder="例: 食べ物"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="difficulty-select">難易度</label>
          <select
            id="difficulty-select"
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
          >
            <option value="">選択してください</option>
            <option value="初級">初級</option>
            <option value="中級">中級</option>
            <option value="上級">上級</option>
            <option value="専門">専門</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {question ? '更新' : '追加'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}

export default QuestionEditorView;
