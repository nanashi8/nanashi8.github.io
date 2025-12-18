# NEW HORIZON単元再編成計画（オプションB）

## 📋 計画概要

**方針**: 既存の問題データを最大限活用し、ファイル名の付け替えと内容補完により公式カリキュラムに準拠させる

**期間**: 段階的実施（Phase 1-5）

**目標**: 全単元が公式NEW HORIZONカリキュラムに完全準拠

---

## 🔍 現状分析まとめ

### Grade 2 マッピング表

| 現在のファイル | 現在の内容 | 移動先 | 公式の内容 | アクション |
|---|---|---|---|---|
| unit0.json | be動詞の過去形 | ❓ | 動詞の過去形（全般） | 拡張 |
| unit1.json | 過去進行形 | unit0 or unit1 | be going to/will | 要確認 |
| unit2.json | 未来表現 | unit1 | 接続詞 | リネーム |
| unit3.json | must/have to | unit4 | 不定詞 | リネーム |
| unit4.json | 不定詞 | unit3 | must/動名詞 | リネーム |
| unit5.json | 動名詞 | unit4 | （調査継続） | 統合？ |
| unit6.json | 接続詞 | unit2 | 比較級 | リネーム |
| unit7.json | 比較級 | unit6 | 受動態 | リネーム |

### Grade 3 マッピング表

| 現在のファイル | 現在の内容 | 移動先 | 公式の内容 | アクション |
|---|---|---|---|---|
| unit0.json | 受動態 | Grade2 unit7 | 既習事項復習 | 移動 |
| unit1.json | 現在完了 | unit1 | 経験用法+SVOC | 補完 |
| unit2.json | 完了・継続 | unit2 | 完了・継続+進行形 | 補完 |
| unit3.json | 経験・結果 | unit1? | It is...to / let/help | 新規作成 |
| unit4.json | 不定詞応用 | unit3? | 間接疑問文+分詞 | 新規作成 |
| unit5.json | 関係代名詞 | unit5 | 関係代名詞 | ✅ |
| unit6.json | 分詞 | unit4 | 仮定法 | 新規作成 |

---

## 📅 Phase別作業計画

### Phase 1: バックアップと準備（30分）

**目標**: 現状を保存し、作業環境を整える

**タスク**:
1. 全ファイルのバックアップ作成
2. 詳細なマッピング表の確認
3. 作業用ディレクトリの準備

**コマンド**:
```bash
# バックアップディレクトリ作成
mkdir -p public/data/grammar/backup_before_reorganization_2025-12-18

# 全ファイルをバックアップ
cp public/data/grammar/grammar_grade{2,3}_unit*.json \
   public/data/grammar/backup_before_reorganization_2025-12-18/

# バックアップ確認
ls -la public/data/grammar/backup_before_reorganization_2025-12-18/
```

**成果物**:
- ✅ バックアップ完了
- ✅ マッピング表確定

---

### Phase 2: Grade 2 ファイル内容の詳細確認（1時間）

**目標**: 各ファイルの問題内容を精査し、正確なマッピングを決定

**タスク**:
1. 各ファイルの問題を抽出してサンプル確認
2. 文法項目の詳細分析
3. 最終マッピング表の作成

**確認項目**:
- Unit 0: be動詞の過去形のみ？一般動詞も含む？
- Unit 1: 過去進行形は公式カリキュラムのどこに該当？
- Unit 5: 動名詞は独立単元？Unit 4の一部？

**スクリプト**:
```bash
# 各ファイルの問題サンプルを表示
for i in {0..7}; do
  file="public/data/grammar/grammar_grade2_unit${i}.json"
  if [ -f "$file" ]; then
    echo "=== Unit $i サンプル ==="
    jq '.questions[0:3] | .[] | {japanese, grammar: .sentence}' "$file"
  fi
done
```

**成果物**:
- ✅ 詳細マッピング表（確定版）
- ✅ 新規作成が必要な単元リスト
- ✅ 補完が必要な文法項目リスト

---

### Phase 3: Grade 2 再編成（2-3時間）

**目標**: Grade 2の全単元を公式カリキュラムに準拠させる

#### Step 3.1: 単純なリネーム（競合なし）

**タスク**:
```bash
# 一時ディレクトリに移動（競合回避）
mkdir -p public/data/grammar/temp_g2

# Unit 2 → Unit 1 (未来表現)
cp public/data/grammar/grammar_grade2_unit2.json \
   public/data/grammar/temp_g2/grammar_grade2_unit1_new.json

# Unit 6 → Unit 2 (接続詞)
cp public/data/grammar/grammar_grade2_unit6.json \
   public/data/grammar/temp_g2/grammar_grade2_unit2_new.json

# Unit 7 → Unit 6 (比較級)
cp public/data/grammar/grammar_grade2_unit7.json \
   public/data/grammar/temp_g2/grammar_grade2_unit6_new.json
```

#### Step 3.2: JSON内容の更新

各ファイルの `unit`, `title`, `grammar` フィールドを公式内容に更新

**Pythonスクリプト例**:
```python
import json

# Unit 1の例
with open('temp_g2/grammar_grade2_unit1_new.json', 'r+', encoding='utf-8') as f:
    data = json.load(f)
    data['unit'] = 'Unit 1'
    data['title'] = '未来表現'
    data['grammar'] = 'be going to / will、未来を表す表現'
    f.seek(0)
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.truncate()
```

#### Step 3.3: 複雑な再編成

**Unit 3/4 の入れ替え**:
- 現unit3 (must) → 新unit4
- 現unit4 (不定詞) → 新unit3
- 現unit5 (動名詞) → 新unit4 に統合

**タスク**:
```bash
# Unit 4 (不定詞) → Unit 3
cp public/data/grammar/grammar_grade2_unit4.json \
   public/data/grammar/temp_g2/grammar_grade2_unit3_new.json

# Unit 3 (must) + Unit 5 (動名詞) → Unit 4
# Python で2ファイルをマージ
```

#### Step 3.4: Unit 0 の拡張

**必要な追加内容**:
- 一般動詞の過去形（規則・不規則）
- 現状: be動詞のみ

**タスク**:
- 一般動詞の問題を20-30問追加

#### Step 3.5: Unit 7 (受動態) の新規作成

**現状**: 該当データなし（Grade 3 Unit 0に誤配置）

**タスク**:
```bash
# Grade 3 Unit 0 → Grade 2 Unit 7
cp public/data/grammar/grammar_grade3_unit0.json \
   public/data/grammar/temp_g2/grammar_grade2_unit7_new.json
# JSON内容を更新
```

#### Step 3.6: Unit 1 の処理決定

**現unit1内容**: 過去進行形

**選択肢**:
1. **削除**: 公式カリキュラムに明示的な単元なし
2. **Unit 0に統合**: 過去形の発展として
3. **別カテゴリ**: 発展学習として保存

**推奨**: Unit 0に統合（過去形の応用として）

#### Step 3.7: Unit 5 の調査と決定

**公式**: データから特定できず

**タスク**:
- Excel資料を再確認
- 現unit5 (動名詞) がUnit 4の一部か確認
- 必要に応じて Unit 4 に統合

**成果物**:
- ✅ Grade 2 全単元が公式構成に準拠
- ✅ temp_g2/ に新ファイル一式

---

### Phase 4: Grade 3 再編成（2-3時間）

**目標**: Grade 3の全単元を公式カリキュラムに準拠させる

#### Step 4.1: Unit 0 の新規作成

**公式内容**: 既習事項の復習

**タスク**:
- 新規作成（既存のunit0は削除済み）
- または空ファイル（enabled: false）として配置

#### Step 4.2: Unit 1-2 の補完

**Unit 1**:
- 現状: 現在完了（一般）
- 追加: SVOC、SVOO の問題

**Unit 2**:
- 現状: 完了・継続
- 追加: 現在完了進行形の問題

#### Step 4.3: Unit 3 の新規作成

**公式内容**: It is ... to / let, help + 人 + 動詞原形

**タスク**:
- 完全新規作成
- 60-70問

#### Step 4.4: Unit 4 の新規作成

**公式内容**: 間接疑問文 + 分詞

**現状**: unit6に分詞データあり → 移動して統合
**不足**: 間接疑問文 → 新規作成

**タスク**:
```bash
# 現unit6 (分詞) を基礎に
cp public/data/grammar/grammar_grade3_unit6.json \
   public/data/grammar/temp_g3/grammar_grade3_unit4_base.json
# 間接疑問文の問題を追加
```

#### Step 4.5: Unit 5 は維持

**Unit 5**: 関係代名詞（既に正しい）

#### Step 4.6: Unit 6 の新規作成

**公式内容**: 仮定法

**タスク**:
- 完全新規作成
- I wish / If + were / If + 過去形
- 60-70問

**成果物**:
- ✅ Grade 3 全単元が公式構成に準拠
- ✅ temp_g3/ に新ファイル一式

---

### Phase 5: 切り替えと検証（30分）

**目標**: 新ファイルを正式版として配置し、検証する

#### Step 5.1: 古いファイルのアーカイブ

```bash
# 現行ファイルをアーカイブ
mkdir -p public/data/grammar/archive_old_structure
mv public/data/grammar/grammar_grade{2,3}_unit*.json \
   public/data/grammar/archive_old_structure/
```

#### Step 5.2: 新ファイルの配置

```bash
# Grade 2
mv public/data/grammar/temp_g2/*.json public/data/grammar/

# Grade 3
mv public/data/grammar/temp_g3/*.json public/data/grammar/
```

#### Step 5.3: 検証

```bash
# 検証スクリプト実行
./scripts/validate-unit-structure.sh

# 期待結果: ✅ 検証成功
```

#### Step 5.4: 問題数の確認

```bash
# 各単元の問題数を確認
for file in public/data/grammar/grammar_grade{2,3}_unit[0-9].json; do
  echo "$(basename $file): $(jq '.totalQuestions' $file) questions"
done
```

**成果物**:
- ✅ 全単元が公式構成に準拠
- ✅ 検証スクリプト成功
- ✅ 問題数の確認完了

---

## 📊 新規作成・補完が必要な単元

### 優先度A（必須・新規作成）

1. **Grade 2 Unit 7**: 受動態
   - 既存データあり（現Grade 3 Unit 0）→ 移動・更新

2. **Grade 3 Unit 0**: 既習事項復習
   - 新規作成 or 空ファイル（enabled: false）

3. **Grade 3 Unit 3**: It is ... to / let, help
   - 完全新規作成（60-70問）

4. **Grade 3 Unit 6**: 仮定法
   - 完全新規作成（60-70問）

### 優先度B（補完）

5. **Grade 2 Unit 0**: 一般動詞の過去形を追加
   - 既存: be動詞のみ → 一般動詞20-30問追加

6. **Grade 2 Unit 5**: 調査後に決定
   - 公式カリキュラムの確認必要

7. **Grade 3 Unit 1**: SVOC、SVOO を追加
   - 既存: 現在完了 → 20-30問追加

8. **Grade 3 Unit 2**: 現在完了進行形を追加
   - 既存: 完了・継続 → 20-30問追加

9. **Grade 3 Unit 4**: 間接疑問文を追加
   - 既存: 分詞（移動後）→ 間接疑問文30-40問追加

### 優先度C（要確認）

10. **Grade 2 Unit 1**: 過去進行形の扱い
    - 削除 or Unit 0統合 or 発展学習

---

## 🔧 実装ツール・スクリプト

### ツール1: ファイルリネームスクリプト

```bash
#!/bin/bash
# scripts/rename-units.sh

mkdir -p public/data/grammar/temp_g2 public/data/grammar/temp_g3

# Grade 2 マッピング
declare -A G2_MAP=(
  ["2"]="1"  # 未来表現
  ["6"]="2"  # 接続詞
  ["4"]="3"  # 不定詞
  ["3"]="4"  # must (動名詞は後で統合)
  ["7"]="6"  # 比較級
)

for old in "${!G2_MAP[@]}"; do
  new="${G2_MAP[$old]}"
  cp "public/data/grammar/grammar_grade2_unit${old}.json" \
     "public/data/grammar/temp_g2/grammar_grade2_unit${new}_new.json"
done
```

### ツール2: JSON更新スクリプト

```python
#!/usr/bin/env python3
# scripts/update-unit-info.py

import json
import sys

def update_unit_info(filepath, unit, title, grammar):
    with open(filepath, 'r+', encoding='utf-8') as f:
        data = json.load(f)
        data['unit'] = unit
        data['title'] = title
        data['grammar'] = grammar
        f.seek(0)
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.truncate()
    print(f"✅ Updated: {filepath}")

if __name__ == "__main__":
    update_unit_info(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
```

### ツール3: ファイルマージスクリプト

```python
#!/usr/bin/env python3
# scripts/merge-units.py

import json
import sys

def merge_units(file1, file2, output, new_unit, new_title, new_grammar):
    with open(file1, 'r', encoding='utf-8') as f:
        data1 = json.load(f)
    with open(file2, 'r', encoding='utf-8') as f:
        data2 = json.load(f)
    
    # 基本情報を更新
    merged = data1.copy()
    merged['unit'] = new_unit
    merged['title'] = new_title
    merged['grammar'] = new_grammar
    
    # 問題を統合
    merged['questions'].extend(data2['questions'])
    merged['totalQuestions'] = len(merged['questions'])
    
    # questionTypesを再計算
    types = {}
    for q in merged['questions']:
        qtype = q['type']
        types[qtype] = types.get(qtype, 0) + 1
    merged['questionTypes'] = types
    
    with open(output, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Merged: {file1} + {file2} → {output}")

if __name__ == "__main__":
    merge_units(sys.argv[1], sys.argv[2], sys.argv[3], 
                sys.argv[4], sys.argv[5], sys.argv[6])
```

---

## ⏱️ 推定作業時間

| Phase | 内容 | 時間 | 担当 |
|---|---|---|---|
| Phase 1 | バックアップと準備 | 30分 | AI |
| Phase 2 | Grade 2 詳細確認 | 1時間 | AI + ユーザー確認 |
| Phase 3 | Grade 2 再編成 | 2-3時間 | AI |
| Phase 4 | Grade 3 再編成 | 2-3時間 | AI |
| Phase 5 | 切り替えと検証 | 30分 | AI |
| **合計** | - | **6-8時間** | - |

※新規作成が必要な単元（Grade 3 Unit 3, 6）は別途時間が必要

---

## ✅ 成功基準

### 最終チェックリスト

- [ ] すべての単元ファイルが公式カリキュラムに準拠
- [ ] `./scripts/validate-unit-structure.sh` がエラーなしで完了
- [ ] 各単元の問題数が適切（最低50問以上）
- [ ] バックアップが保存されている
- [ ] Grade 2: Unit 0-7 のみ存在
- [ ] Grade 3: Unit 0-6 のみ存在
- [ ] すべての単元の `unit`, `title`, `grammar` が公式と一致
- [ ] 新規作成した問題の品質確認完了

---

## 🚀 次のステップ

### Phase 1 実行準備

承認いただければ、すぐにPhase 1（バックアップと準備）を開始できます。

**実行コマンド**:
```bash
# Phase 1開始
mkdir -p public/data/grammar/backup_before_reorganization_2025-12-18
cp public/data/grammar/grammar_grade{2,3}_unit*.json \
   public/data/grammar/backup_before_reorganization_2025-12-18/
```

Phase 1完了後、Phase 2の詳細確認に進みます。

---

**作成日**: 2025年12月18日  
**最終更新**: 2025年12月18日  
**ステータス**: 承認待ち  
**優先度**: 🔴 最高
