import React from 'react';

/**
 * タッチとクリックの両方に対応するイベントハンドラーを返す
 * モバイルでのホバー状態の残存を自動的に防止
 *
 * @param callback - クリック/タッチ時に実行される関数
 * @param onLongPress - 長押し検出時に実行される関数（任意）
 * @param longPressDuration - 長押し判定の時間（ミリ秒、デフォルト: 500ms）
 *
 * @returns React イベントハンドラーオブジェクト
 *
 * @example
 * const buttonProps = useResponsiveClick(() => handleAnswer(choice));
 * <button {...buttonProps}>選択肢</button>
 */
interface UseResponsiveClickOptions {
  onLongPress?: () => void;
  longPressDuration?: number;
}

export const useResponsiveClick = (callback: () => void, options?: UseResponsiveClickOptions) => {
  const { onLongPress, longPressDuration = 500 } = options || {};

  const touchStartTimeRef = React.useRef<number>(0);
  const longPressTimerRef = React.useRef<NodeJS.Timeout>();

  const handleTouchStart = (_e: React.TouchEvent) => {
    touchStartTimeRef.current = Date.now();

    // 長押し検出
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress();
      }, longPressDuration);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // 長押しタイマーをクリア
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    const touchDuration = Date.now() - touchStartTimeRef.current;

    // タップ検出（長押しではない短い操作）
    if (touchDuration < longPressDuration) {
      e.preventDefault(); // ホバー状態を防止
      callback();
    }
  };

  const handleTouchMove = () => {
    // スワイプ中は長押しをキャンセル
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  return {
    onClick: callback,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
  };
};

/**
 * ボタンの active/disabled 状態をスマートに制御
 * モバイルではタップ時に視覚的フィードバック、デスクトップではホバー効果
 *
 * @example
 * const [isActive, setIsActive] = useState(false);
 * const { className: buttonClass } = useResponsiveButton(isActive);
 * <button className={buttonClass} onMouseDown={() => setIsActive(true)} onMouseUp={() => setIsActive(false)}>
 */
export const useResponsiveButton = (isActive: boolean = false) => {
  return {
    className: `
      transition-all duration-200
      ${isActive ? 'scale-95 shadow-inner' : 'scale-100 shadow-sm'}
      active:scale-95 active:shadow-inner
    `,
  };
};

/**
 * マルチタッチジェスチャーを簡単に検出
 * ピンチズーム、2本指タップなど
 *
 * @example
 * const { initialDistance } = useMultiTouch({
 *   onPinch: (delta) => console.log('Pinch:', delta),
 *   onDoubleTap: () => console.log('Double tap!'),
 * });
 */
interface UseMultiTouchOptions {
  onPinch?: (scale: number) => void;
  onDoubleTap?: () => void;
  onRotate?: (angle: number) => void;
}

export const useMultiTouch = (options?: UseMultiTouchOptions) => {
  const touchesRef = React.useRef<React.TouchList>();
  const lastTouchTimeRef = React.useRef<number>(0);
  const initialDistanceRef = React.useRef<number>(0);

  const getDistance = (touches: React.TouchList): number => {
    if (touches.length !== 2) return 0;

    const touch1 = touches[0];
    const touch2 = touches[1];

    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;

    return Math.sqrt(dx * dx + dy * dy);
  };

  const _handleTouchStart = (e: React.TouchEvent) => {
    touchesRef.current = e.touches;

    // 2本指タッチ: 初期距離を記録
    if (e.touches.length === 2) {
      initialDistanceRef.current = getDistance(e.touches);
    }

    // ダブルタップ検出
    const now = Date.now();
    if (now - lastTouchTimeRef.current < 300 && options?.onDoubleTap) {
      options.onDoubleTap();
    }
    lastTouchTimeRef.current = now;
  };

  const _handleTouchMove = (e: React.TouchEvent) => {
    // ピンチズーム検出
    if (e.touches.length === 2 && options?.onPinch) {
      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / initialDistanceRef.current;
      options.onPinch(scale);
    }
  };

  return { onTouchStart: _handleTouchStart, onTouchMove: _handleTouchMove };
};
