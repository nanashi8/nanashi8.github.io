/**
 * クイズ設定カスタムフック
 * 自動進行、遅延時間などの設定を管理
 */

import { useState } from 'react';

export function useQuizSettings() {
  const [autoAdvance] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoAdvance');
    return saved ? JSON.parse(saved) : false;
  });

  const [autoAdvanceDelay] = useState<number>(() => {
    const saved = localStorage.getItem('autoAdvanceDelay');
    return saved ? parseInt(saved, 10) : 1500;
  });

  return {
    autoAdvance,
    autoAdvanceDelay,
  };
}
