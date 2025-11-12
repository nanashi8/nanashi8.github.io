import { QuestionSet } from '../types';

interface QuestionSetSelectorProps {
  questionSets: QuestionSet[];
  selectedSetId: string | null;
  onSelect: (setId: string) => void;
  label?: string;
}

function QuestionSetSelector({
  questionSets,
  selectedSetId,
  onSelect,
  label = '問題集を選択',
}: QuestionSetSelectorProps) {
  return (
    <div className="question-set-selector">
      <label htmlFor="question-set-select" className="selector-label">
        {label}
      </label>
      <select
        id="question-set-select"
        className="question-set-select"
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
  );
}

export default QuestionSetSelector;
