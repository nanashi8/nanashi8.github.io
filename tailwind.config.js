/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // .dark クラスでダークモード切り替え
  theme: {
    extend: {
      maxWidth: {
        'app': '1200px', // アプリ全体の統一最大幅
      },
      colors: {
        // 22色パレット準拠: 中学生向けシンプルデザイン
        white: '#fff',
        black: '#000',
        primary: {
          DEFAULT: '#1976d2', // 濃い青（ライト用）
          hover: '#1565c0',
          dark: '#616161', // 濃いグレー（ダーク用）
          'dark-hover': '#757575',
        },
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
          dark: '#4ade80',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          dark: '#f87171',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fff3cd',
          dark: '#fbbf24',
        },
        info: {
          DEFAULT: '#1976d2',
          light: '#e3f2fd',
          dark: '#60a5fa',
        },
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e0e0e0',
          300: '#bdbdbd',
          400: '#9e9e9e',
          500: '#757575',
          600: '#616161',
          700: '#424242',
          800: '#303030',
          850: '#262626',
          900: '#1a1a1a',
        },
        // CSS変数ベースのカスタムカラー
        'text-color': 'var(--text-color)',
        'text-secondary': 'var(--text-secondary)',
        'bg-primary': 'var(--background)',
        'bg-secondary': 'var(--bg-secondary)',
        'card-bg': 'var(--card-bg)',
        'card-border': 'var(--card-border)',
        'border-color': 'var(--border-color)',
      },
      spacing: {
        // 既存のスペーシング値
        '0.5': '0.125rem',  // 2px
        '1': '0.25rem',     // 4px
        '2': '0.5rem',      // 8px
        '3': '0.75rem',     // 12px
        '4': '1rem',        // 16px
        '5': '1.25rem',     // 20px
        '6': '1.5rem',      // 24px
        '8': '2rem',        // 32px
        '10': '2.5rem',     // 40px
        '12': '3rem',       // 48px
      },
      borderRadius: {
        'sm': '0.25rem',    // 4px
        'DEFAULT': '0.5rem', // 8px
        'md': '0.5rem',     // 8px
        'lg': '0.75rem',    // 12px
        'xl': '1rem',       // 16px
        '2xl': '1.5rem',    // 24px
      },
      fontSize: {
        // 業界標準準拠: Material Design, Bootstrap, Tailwind CSS
        // [fontSize, { lineHeight, letterSpacing }]
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],     // 16px ← 基準
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],     // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.05em' }],    // 36px
      },
      lineHeight: {
        'none': '1',
        'tight': '1.25',
        'snug': '1.375',
        'normal': '1.5',
        'relaxed': '1.625',
        'loose': '2',
      },
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
      },
      fontWeight: {
        'thin': '100',
        'extralight': '200',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
      transitionDuration: {
        'DEFAULT': '300ms',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
