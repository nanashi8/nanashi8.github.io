import React, { useEffect, useState } from 'react';
import { sessionManager } from '../utils/sessionManager';

/**
 * アップデート通知コンポーネント
 * 生徒が学習中のアップデートを非侵襲的に知らせる
 */
export const UpdateNotification: React.FC<{ isLearningActive: boolean }> = ({
  isLearningActive,
}) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateTime, setUpdateTime] = useState<string | null>(null);

  useEffect(() => {
    // アップデート検知リスナーを設定
    sessionManager.onUpdateAvailable((timestamp) => {
      setUpdateAvailable(true);
      setUpdateTime(timestamp);

      // 学習中でない場合は自動更新（3秒後）
      if (!isLearningActive) {
        setTimeout(() => {
          sessionManager.applyUpdate(true);
        }, 3000);
      }
    });
  }, [isLearningActive]);

  if (!updateAvailable) return null;

  return (
    <div className="update-notification" role="alert" aria-live="polite">
      <div className="update-notification__content">
        <span className="update-notification__icon">🔄</span>
        <div className="update-notification__text">
          <p className="update-notification__title">
            {isLearningActive ? '新しい更新が利用可能です' : '更新をインストール中...'}
          </p>
          {updateTime && <p className="update-notification__time">{updateTime} 検出</p>}
        </div>
        {isLearningActive && (
          <div className="update-notification__actions">
            <button
              className="update-notification__button update-notification__button--later"
              onClick={() => {
                // 学習終了後に更新
                console.log('後で更新します。学習終了後に自動更新されます。');
              }}
            >
              後で
            </button>
            <button
              className="update-notification__button update-notification__button--now"
              onClick={() => {
                sessionManager.applyUpdate(true);
              }}
            >
              今すぐ更新
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
