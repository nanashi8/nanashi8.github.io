const purgecss = require('@fullhuman/postcss-purgecss').default;

module.exports = {
  plugins: [
    purgecss({
      content: [
        './index.html',
        './src/**/*.{js,jsx,ts,tsx}',
        './public/**/*.html',
      ],
      // 保護するクラス（動的に生成されるクラスなど）
      safelist: {
        // 標準的な保護パターン
        standard: [
          /^dark-mode/,
          /^plan-color-/,
          /^badge-/,
          /^btn-/,
          /^card-/,
          /^icon-/,
          /^progress-/,
          /^stat-/,
          /^quiz-/,
          /^passage-/,
          /^translation-/,
          /^scoreboard-/,
          /^analytics-/,
          /^settings-/,
          /^daily-plan-/,
          /^reading-/,
          /^spelling-/,
          /^comprehension-/,
        ],
        // 深い階層のマッチング（子要素も含む）
        deep: [
          /^quiz-.*-active$/,
          /^quiz-.*-correct$/,
          /^quiz-.*-incorrect$/,
          /^tab-.*-active$/,
        ],
        // 貪欲マッチング（属性セレクタなど）
        greedy: [
          /^data-/,
          /^aria-/,
        ],
      },
      // デフォルトの除外セレクタ
      defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
    }),
  ],
};
