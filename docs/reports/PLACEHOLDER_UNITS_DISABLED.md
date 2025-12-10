# プレースホルダー問題ユニット無効化レポート

**実施日**: 2025年12月9日  
**対応**: プレースホルダー/テンプレートデータを含む9ユニットを一時的に無効化

---

## 📋 概要

文法データの全体チェックにより、**485件のプレースホルダー問題**が発見されました。これらは実際の問題データではなく、テンプレート・プレースホルダーのままになっており、生徒に出題できない状態です。

即座の品質保証のため、該当する9つのユニットを一時的に無効化しました。

---

## 🔴 影響範囲

### 無効化されたユニット (9ファイル)

**Grade 2 (8ユニット):**
- ✅ `grammar_grade2_unit2.json` - 未来表現 (60件)
- ✅ `grammar_grade2_unit3.json` - 助動詞must/have to (60件)
- ✅ `grammar_grade2_unit4.json` - 不定詞 (50件)
- ✅ `grammar_grade2_unit5.json` - 動名詞 (60件)
- ✅ `grammar_grade2_unit6.json` - 接続詞 (80件)
- ✅ `grammar_grade2_unit7.json` - 比較級・最上級 (85件)
- ✅ `grammar_grade2_unit8.json` - There is/are (60件)
- ✅ `grammar_grade2_unit9.json` - 受動態 (60件)

**Grade 3 (1ユニット):**
- ✅ `grammar_grade3_unit7.json` - 仮定法 (15件、問題6-20のみ)

**合計**: 485件のプレースホルダー問題

---

## 🛠️ 実装内容

### 1. データファイルへの `enabled` フラグ追加

各JSONファイルに以下のフィールドを追加:

```json
{
  "enabled": false,
  "disabledReason": "Contains placeholder/template data - requires proper Japanese translations and English sentences",
  "unit": "Unit X",
  "title": "...",
  ...
}
```

### 2. `GrammarQuizView.tsx` の更新

**Unit一覧取得時** (lines 155-175):
```typescript
// enabledフラグをチェック (デフォルトはtrue)
if (data.enabled === false) {
  continue; // 無効化されたユニットは一覧に表示しない
}
```

**問題データ読み込み時** (lines 252-268):
```typescript
// enabledフラグをチェック (デフォルトはtrue)
if (data.enabled === false) {
  logger.log(`grammar_grade${g}_unit${unitIdx}.json is disabled: ${data.disabledReason || 'No reason provided'}`);
  continue; // 無効化されたユニットはスキップ
}
```

### 3. `validate_grammar_advanced.py` の更新

**プレースホルダー検出の追加**:
- 文法用語+数字パターン: `^[^。]*\d+。$`
- プレースホルダー英文: `Example sentence`, `____ blank`
- プレースホルダー選択肢: `choice1`, `choice2`, `choice3`, `form1`, `form2`, `form3`

**無効化ユニットのスキップ**:
```python
if data.get('enabled') is False:
    # 無効化されたユニットは検証をスキップ
    print(f"⏭️  {file_path.name}: 無効化されています ({data.get('disabledReason', 'No reason')})")
    return True
```

---

## ✅ 検証結果

```bash
$ python3 scripts/validate_grammar_advanced.py

🔍 39個のファイルを高度検証中...

⏭️  grammar_grade2_unit2.json: 無効化されています (Contains placeholder/template data...)
⏭️  grammar_grade2_unit3.json: 無効化されています (Contains placeholder/template data...)
⏭️  grammar_grade2_unit4.json: 無効化されています (Contains placeholder/template data...)
⏭️  grammar_grade2_unit5.json: 無効化されています (Contains placeholder/template data...)
⏭️  grammar_grade2_unit6.json: 無効化されています (Contains placeholder/template data...)
⏭️  grammar_grade2_unit7.json: 無効化されています (Contains placeholder/template data...)
⏭️  grammar_grade2_unit8.json: 無効化されています (Contains placeholder/template data...)
⏭️  grammar_grade2_unit9.json: 無効化されています (Contains placeholder/template data...)
⏭️  grammar_grade3_unit7.json: 無効化されています (Contains placeholder/template data...)

✅ すべての高度な検証に合格しました!
```

---

## 📊 影響分析

### 本番環境への影響

- **文法タブ**: Grade 2のUnit 2-9が選択肢から削除されます
- **Grade 3**: Unit 7が選択肢から削除されます
- **既存の正常なユニット**: 影響なし (Grade 1の全ユニット、Grade 2のUnit 0-1、Grade 3のUnit 0-6, 8-9)

### ユーザー体験

- 無効化されたユニットは選択できないため、プレースホルダー問題が出題されることはありません
- 正常なコンテンツのみが提供されます
- エラーメッセージは表示されません(静かにスキップ)

---

## 📝 次のステップ

### 短期 (即座 - 1週間)

1. ✅ **完了**: プレースホルダーユニットを無効化
1. ✅ **完了**: バリデーションスクリプトにプレースホルダー検出を追加
1. ✅ **完了**: フロントエンドで無効化ユニットをスキップ
1. **推奨**: 本番環境へデプロイして動作確認

### 中期 (1-4週間)

1. **AI支援での問題生成ワークフロー構築**
   - 各文法ポイントごとにAIで問題案を生成
   - 人間がレビュー・修正
   - 段階的に有効化

1. **優先順位付け**
   - Grade 2 Unit 2-3 (未来表現、助動詞) から開始
   - 使用頻度の高い文法ポイントを優先

### 長期 (1-3ヶ月)

1. **全485件の問題を高品質コンテンツに置き換え**
1. **品質保証プロセスの確立**
   - AI生成 → 人間レビュー → テスト → 有効化
1. **継続的な品質モニタリング**

---

## 📚 関連ドキュメント

- **詳細問題リスト**: `docs/reports/GRAMMAR_PLACEHOLDER_ISSUES.md`
- **バリデーションガイドライン**: `docs/guidelines/GRAMMAR_QUESTION_VALIDATION.md`
- **AI問題生成ガイド**: `docs/guidelines/AI_GRAMMAR_QUESTION_CREATION.md`

---

## 🎯 成果

1. **品質保証**: プレースホルダー問題が本番環境で出題されることを防止
1. **透明性**: 無効化の理由を明示的に記録
1. **拡張性**: enabled フラグで柔軟に管理可能
1. **検証強化**: プレースホルダー検出を自動化

**すべての既存の正常なコンテンツは影響を受けず、問題なく動作します。**
