interface LearningLimitsInputProps {
  learningLimit: number;
  reviewLimit: number;
  onLearningLimitChange: (value: number) => void;
  onReviewLimitChange: (value: number) => void;
  idPrefix?: string;
}

const LIMIT_OPTIONS = [0, 5, 10, 20, 30, 50, 100, 150, 200] as const;

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
        <select
          id={`${idPrefix}learning-limit`}
          value={learningLimit}
          onChange={(e) => onLearningLimitChange(parseInt(e.target.value))}
        >
          {LIMIT_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option === 0 ? '設定無し' : option}
            </option>
          ))}
        </select>
        <p className="setting-help">この数に達したら既存の内容で繰り返し出題（デフォルト: 30）</p>
      </div>

      <div className="filter-group">
        <label htmlFor={`${idPrefix}review-limit`}>⚠️ 要復習の上限:</label>
        <select
          id={`${idPrefix}review-limit`}
          value={reviewLimit}
          onChange={(e) => onReviewLimitChange(parseInt(e.target.value))}
        >
          {LIMIT_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option === 0 ? '設定無し' : option}
            </option>
          ))}
        </select>
        <p className="setting-help">この数に達したら既存の内容で繰り返し出題（デフォルト: 10）</p>
      </div>
    </>
  );
}
