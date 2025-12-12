import { useState, useEffect } from 'react';

/**
 * メディアクエリをReactフックで扱う
 * 指定されたブレークポイント以下がモバイルと判定される
 *
 * @param breakpoint - ブレークポイント（ピクセル）。デフォルト: 768px
 * @returns { isMobile: boolean, isTablet: boolean, isDesktop: boolean }
 *
 * @example
 * const { isMobile, isTablet, isDesktop } = useMediaQuery();
 *
 * if (isMobile) {
 *   // モバイル: 320px～767px
 * } else if (isTablet) {
 *   // タブレット: 768px～1023px
 * } else {
 *   // デスクトップ: 1024px～
 * }
 */
export const useMediaQuery = (breakpoint: number = 768) => {
  const [isMobile, setIsMobile] = useState(() => {
    // SSR対応：初期値はウィンドウサイズから判定
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    return width > breakpoint && width <= 1023;
  });

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > 1023;
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= breakpoint);
      setIsTablet(width > breakpoint && width <= 1023);
      setIsDesktop(width > 1023);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return { isMobile, isTablet, isDesktop };
};

/**
 * 指定されたブレークポイント以下がモバイルか判定
 * useMediaQuery()よりシンプル
 *
 * @param breakpoint - ブレークポイント（ピクセル）。デフォルト: 768px
 * @returns boolean
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

/**
 * デバイスサイズを取得（より詳細な制御が必要な場合）
 *
 * @returns { width: number, height: number, orientation: 'portrait' | 'landscape' }
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    orientation:
      typeof window !== 'undefined' && window.innerWidth < window.innerHeight
        ? ('portrait' as const)
        : ('landscape' as const),
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: window.innerWidth < window.innerHeight ? 'portrait' : 'landscape',
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};
