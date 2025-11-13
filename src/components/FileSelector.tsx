import { ChangeEvent } from 'react';

interface FileSelectorProps {
  onLoadCSV: (filePath: string) => void;
  onLoadLocalFile: (file: File) => void;
}

function FileSelector({ onLoadCSV, onLoadLocalFile }: FileSelectorProps) {
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

  return (
    <div className="file-selector">
      <div className="file-select-group">
        <select onChange={handleSelectChange} defaultValue="">
          <option value="">問題集を選択...</option>
          <option value="/data/basic-english.csv">基本英単語 (20問)</option>
          <option value="/data/animals.csv">動物の英語 (15問)</option>
          <option value="/data/food.csv">食べ物の英語 (15問)</option>
        </select>
        <label className="file-upload-label file-upload-ios-safe">
          📁 ローカルファイル
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  );
}

export default FileSelector;
