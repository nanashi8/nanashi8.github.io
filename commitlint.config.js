export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新機能
        'fix', // バグ修正
        'docs', // ドキュメント変更
        'style', // コード整形（機能変更なし）
        'refactor', // リファクタリング
        'perf', // パフォーマンス改善
        'test', // テスト追加・修正
        'chore', // ビルドプロセス・補助ツール変更
        'ci', // CI設定変更
        'revert', // コミット取り消し
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'subject-case': [0], // 日本語対応のためケースチェック無効
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always'],
  },
};
