/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // .dark クラスでダークモード切り替え
  theme: {
    extend: {
      colors: {
        // 22色パレット準拠: 既存のCSS変数からTailwindカラーパレットへマッピング
        primary: {
          DEFAULT: '#667eea',
          hover: '#8b9ef5',
        },
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
          dark: '#065f46',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          dark: '#991b1b',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fff3cd',
          dark: '#78350f',
        },
        info: {
          DEFAULT: '#2196f3',
          light: '#e7f3ff',
          dark: '#0056b3',
        },
        gray: {
          100: '#f8f9fa',
          200: '#e9ecef',
          300: '#e0e0e0',
          400: '#ccc',
          500: '#aaa',
          600: '#999',
          700: '#666',
          800: '#444',
          900: '#333',
        },
        accent: {
          blue: '#3b82f6',
          red: '#f44336',
          purple: '#9c27b0',
        },
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
        'xs': '0.75rem',    // 12px
        'sm': '0.875rem',   // 14px
        'base': '1rem',     // 16px
        'lg': '1.125rem',   // 18px
        'xl': '1.25rem',    // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
        '4xl': '2.25rem',   // 36px
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
