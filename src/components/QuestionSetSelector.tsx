import { QuestionSet } from '../types';

export type DifficultyLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';
export type WordPhraseFilter = 'all' | 'words-only' | 'phrases-only';

interface QuestionSetSelectorProps {
  questionSets: QuestionSet[];
  selectedSetId: string | null;
  onSelect: (setId: string) => void;
  selectedDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
  selectedWordPhraseFilter?: WordPhraseFilter;
  onWordPhraseFilterChange?: (filter: WordPhraseFilter) => void;
  label?: string;
}

function QuestionSetSelector({
  questionSets,
  selectedSetId,
  onSelect,
  selectedDifficulty,
  onDifficultyChange,
  selectedWordPhraseFilter = 'all',
  onWordPhraseFilterChange,
  label = '問題集を選択',
}: QuestionSetSelectorProps) {
  const selectedSet = questionSets.find((set) => set.id === selectedSetId);

  // 選択された問題集の難易度別単語数を計算
  const difficultyCount = selectedSet
    ? {
        beginner: selectedSet.questions.filter((q) => q.difficulty === '初級').length,
        intermediate: selectedSet.questions.filter((q) => q.difficulty === '中級').length,
        advanced: selectedSet.questions.filter((q) => q.difficulty === '上級').length,
      }
    : null;

  // 単語/熟語の数をカウント
  const wordPhraseCount = selectedSet
    ? {
        words: selectedSet.questions.filter((q) => !q.word.includes(' ')).length,
        phrases: selectedSet.questions.filter((q) => q.word.includes(' ')).length,
      }
    : null;

  return (
    <div className="question-set-selector">
      <div className="selector-group">
        {/* 問題集選択 */}
        <div className="selector-item">
          <label htmlFor="question-set-select" className="selector-label">
            📚 {label}
          </label>
          <select
            id="question-set-select"
            className="selector-dropdown"
            value={selectedSetId || ''}
            onChange={(e) => onSelect(e.target.value)}
          >
            <option value="">-- 問題集を選択してください --</option>
            {questionSets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name} ({set.questions.length}問)
              </option>
            ))}
          </select>
        </div>

        {/* 難易度レベル選択 */}
        <div className="selector-item">
          <label htmlFor="difficulty-select" className="selector-label">
            🎯 難易度レベル
          </label>
          <select
            id="difficulty-select"
            className="selector-dropdown"
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value as DifficultyLevel)}
            disabled={!selectedSetId}
          >
            <option value="all">
              すべて {difficultyCount ? `(${selectedSet!.questions.length}語)` : ''}
            </option>
            <option value="beginner">
              初級 🌱 {difficultyCount ? `(${difficultyCount.beginner}語)` : ''}
            </option>
            <option value="intermediate">
              中級 💪 {difficultyCount ? `(${difficultyCount.intermediate}語)` : ''}
            </option>
            <option value="advanced">
              上級 🔥 {difficultyCount ? `(${difficultyCount.advanced}語)` : ''}
            </option>
          </select>
        </div>

        {/* 単語/熟語フィルター選択 */}
        {onWordPhraseFilterChange && (
          <div className="selector-item">
            <label htmlFor="word-phrase-filter" className="selector-label">
              📖 単語/熟語
            </label>
            <select
              id="word-phrase-filter"
              className="selector-dropdown"
              value={selectedWordPhraseFilter}
              onChange={(e) => onWordPhraseFilterChange(e.target.value as WordPhraseFilter)}
              disabled={!selectedSetId}
            >
              <option value="all">
                すべて {wordPhraseCount ? `(${selectedSet!.questions.length}語)` : ''}
              </option>
              <option value="words-only">
                単語のみ 📝 {wordPhraseCount ? `(${wordPhraseCount.words}語)` : ''}
              </option>
              <option value="phrases-only">
                熟語のみ 🔗 {wordPhraseCount ? `(${wordPhraseCount.phrases}語)` : ''}
              </option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionSetSelector;
