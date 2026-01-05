import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'playwright-report', 'test-results', 'coverage', 'scripts/**/*.ts'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // 型安全性は別フェーズで強化するため、警告を排除
      '@typescript-eslint/no-explicit-any': 'off',
      // 一部環境で no-unused-expressions がオプション無しだとクラッシュするため明示
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true },
      ],
      // 未使用変数は段階的に解消。まずは警告から再有効化
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // フックの最適化は後続フェーズ
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/purity': 'off',
      // 開発体験を損ねない範囲のルール
      'react-refresh/only-export-components': 'off',
      'no-empty-pattern': 'warn',
      'no-case-declarations': 'off',
      'prefer-const': 'warn',
      'no-dupe-else-if': 'error',
      'react-hooks/immutability': 'off',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
);
