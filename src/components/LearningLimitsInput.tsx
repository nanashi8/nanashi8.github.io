interface LearningLimitsInputProps {
  learningLimit: number;
  reviewLimit: number;
  onLearningLimitChange: (value: number) => void;
  onReviewLimitChange: (value: number) => void;
  idPrefix?: string;
}

/**
 * 学習中・要復習の上限設定入力コンポーネント
 * UIの重複を避けるための共通コンポーネント
 */
export default function LearningLimitsInput({
  learningLimit,
  reviewLimit,
  onLearningLimitChange,
  onReviewLimitChange,
  idPrefix = '',
}: LearningLimitsInputProps) {
  return (
    <>
      <div className="filter-group">
        <label htmlFor={`${idPrefix}learning-limit`}>🎯 学習中の上限:</label>
        <input
          type="number"
          id={`${idPrefix}learning-limit`}
          min="1"
          value={learningLimit}
          className="number-input"
          onChange={(e) => onLearningLimitChange(parseInt(e.target.value) || 30)}
        />
        <p className="setting-help">この数に達したら既存の内容で繰り返し出題（デフォルト: 30）</p>
      </div>

      <div className="filter-group">
        <label htmlFor={`${idPrefix}review-limit`}>⚠️ 要復習の上限:</label>
        <input
          type="number"
          id={`${idPrefix}review-limit`}
          min="1"
          value={reviewLimit}
          className="number-input"
          onChange={(e) => onReviewLimitChange(parseInt(e.target.value) || 10)}
        />
        <p className="setting-help">この数に達したら既存の内容で繰り返し出題（デフォルト: 10）</p>
      </div>
    </>
  );
}
