import { ChangeEvent } from 'react';

export type DifficultyLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

interface FileSelectorProps {
  onLoadCSV: (filePath: string) => void;
  onLoadLocalFile: (file: File) => void;
  selectedDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
}

function FileSelector({ 
  onLoadCSV, 
  onLoadLocalFile,
  selectedDifficulty,
  onDifficultyChange 
}: FileSelectorProps) {
  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const filePath = e.target.value;
    if (filePath) {
      onLoadCSV(filePath);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadLocalFile(file);
    }
  };

  const handleDifficultyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onDifficultyChange(e.target.value as DifficultyLevel);
  };

  return (
    <div className="file-selector">
      <div className="file-select-group">
        {/* 問題集選択 */}
        <div className="selector-item">
          <label htmlFor="file-selector-dropdown" className="selector-label">📚 問題集</label>
          <select 
            id="file-selector-dropdown"
            onChange={handleSelectChange} 
            defaultValue=""
            className="selector-dropdown"
            aria-label="問題集を選択"
          >
            <option value="">問題集を選択...</option>
            <option value="/data/high-school-entrance-words.csv">中学生・高校受験英単語 (3,600語)</option>
          </select>
        </div>

        {/* 難易度レベル選択 */}
        <div className="selector-item">
          <label htmlFor="difficulty-selector-dropdown" className="selector-label">🎯 難易度レベル</label>
          <select 
            id="difficulty-selector-dropdown"
            value={selectedDifficulty}
            onChange={handleDifficultyChange}
            className="selector-dropdown"
            aria-label="難易度レベルを選択"
          >
            <option value="all">すべて (初級〜上級)</option>
            <option value="beginner">初級 (1,077語) 🌱</option>
            <option value="intermediate">中級 (1,616語) 💪</option>
            <option value="advanced">上級 (885語) 🔥</option>
          </select>
        </div>

        {/* ローカルファイルアップロード */}
        <label className="file-upload-label file-upload-ios-safe">
          📁 ローカルファイル
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="file-input-hidden"
          />
        </label>
      </div>
    </div>
  );
}

export default FileSelector;
