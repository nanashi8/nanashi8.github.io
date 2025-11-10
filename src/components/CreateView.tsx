import { useState, ChangeEvent, FormEvent } from 'react';
import { CreatedQuestion } from '../types';

function CreateView() {
  const [questions, setQuestions] = useState<CreatedQuestion[]>([]);
  const [formData, setFormData] = useState({
    word: '',
    reading: '',
    meaning: '',
    etymology: '',
    relatedWords: '',
    relatedFields: '',
    difficulty: '2',
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.word.trim() || !formData.meaning.trim()) {
      alert('語句と意味は必須項目です');
      return;
    }

    setQuestions((prev) => [...prev, { ...formData }]);
    setFormData({
      word: '',
      reading: '',
      meaning: '',
      etymology: '',
      relatedWords: '',
      relatedFields: '',
      difficulty: '2',
    });
  };

  const handleDelete = (index: number) => {
    if (confirm('この問題を削除しますか？')) {
      setQuestions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleDownload = () => {
    if (questions.length === 0) {
      alert('ダウンロードする問題がありません');
      return;
    }

    let csvContent = '語句,読み,意味,語源等解説,関連語,関連分野,難易度\n';
    questions.forEach((q) => {
      csvContent += `${q.word},${q.reading},${q.meaning},${q.etymology},${q.relatedWords},${q.relatedFields},${q.difficulty}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `quiz-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const templateContent = `語句,読み,意味,語源等解説,関連語,関連分野,難易度
apple,アップル,りんご,果物の一種,fruit;banana,食べ物;果物,1
cat,キャット,猫,動物,dog;pet,動物,1`;

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="create-view">
      <form className="question-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>語句 *</label>
          <input
            type="text"
            name="word"
            value={formData.word}
            onChange={handleInputChange}
            placeholder="apple"
            required
          />
        </div>

        <div className="form-group">
          <label>読み</label>
          <input
            type="text"
            name="reading"
            value={formData.reading}
            onChange={handleInputChange}
            placeholder="アップル"
          />
        </div>

        <div className="form-group">
          <label>意味 *</label>
          <input
            type="text"
            name="meaning"
            value={formData.meaning}
            onChange={handleInputChange}
            placeholder="りんご"
            required
          />
        </div>

        <div className="form-group">
          <label>語源等解説</label>
          <textarea
            name="etymology"
            value={formData.etymology}
            onChange={handleInputChange}
            placeholder="果物の一種"
            rows={2}
          />
        </div>

        <div className="form-group">
          <label>関連語</label>
          <input
            type="text"
            name="relatedWords"
            value={formData.relatedWords}
            onChange={handleInputChange}
            placeholder="fruit;banana"
          />
        </div>

        <div className="form-group">
          <label>関連分野</label>
          <input
            type="text"
            name="relatedFields"
            value={formData.relatedFields}
            onChange={handleInputChange}
            placeholder="食べ物;果物"
          />
        </div>

        <div className="form-group">
          <label>難易度</label>
          <select name="difficulty" value={formData.difficulty} onChange={handleInputChange}>
            <option value="1">1 - 易しい</option>
            <option value="2">2 - 普通</option>
            <option value="3">3 - 難しい</option>
          </select>
        </div>

        <button type="submit" className="add-btn">
          ➕ 問題を追加
        </button>
      </form>

      <div className="question-list">
        <div className="list-header">
          <h3>作成した問題 ({questions.length}問)</h3>
          <div className="list-actions">
            <button
              className="download-btn"
              onClick={handleDownload}
              disabled={questions.length === 0}
            >
              📥 CSVダウンロード
            </button>
            <button className="template-btn" onClick={handleDownloadTemplate}>
              📄 テンプレート
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="empty-state">
            <p>まだ問題が作成されていません</p>
          </div>
        ) : (
          <div className="question-items">
            {questions.map((q, index) => (
              <div key={index} className="question-item">
                <div className="question-item-content">
                  <div className="question-item-word">{q.word}</div>
                  <div className="question-item-details">
                    意味: {q.meaning}
                    {q.reading && ` / 読み: ${q.reading}`}
                    {q.relatedFields && ` / 分野: ${q.relatedFields}`}
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(index)}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateView;
