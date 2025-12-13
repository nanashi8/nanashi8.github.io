# カバレッジ分析と改善提案

## 📊 現在のカバレッジ状況

### TypeScript (ユニットテスト)
```
全体カバレッジ: 20.66%
- src/utils.ts: 49.26% (202/410行)
- src/storage/: 7-14% (非常に低い)
- src/utils/: 75.32% (良好)
```

### Python (スクリプト)
```
カバレッジ測定なし
- 統合テスト: 52/52 passing (TypeScript)
- Pythonユニットテスト: 未実装
```

---

## 🚨 重大な不足部分

### 1. **Pythonスクリプトのユニットテスト不在** (最優先)

**現状**:
- ✅ `context_database.py`: 229行 - テストなし
- ✅ `project_ai_servant.py`: 388行 - テストなし
- ✅ `maintenance_ai.py`: 実装済み - テストなし
- ✅ `quality_nervous_system.py`: 実装済み - テストなし

**問題点**:
1. TypeScriptテストはファイル存在と内容のパターンマッチングのみ
2. 実際のPythonコード実行の正確性が未検証
3. リファクタリング時の安全性がない

**影響度**: 🔴 CRITICAL

---

### 2. **ストレージ層のカバレッジ不足** (高優先度)

**現状**:
```
src/storage/indexedDB/indexedDBStorage.ts: 2.56%
src/storage/manager/storageManager.ts: 7.57%
src/storage/migration/dataMigration.ts: 1.17%
src/storage/progress/progressStorage.ts: 7.3%
```

**未テスト機能**:
- IndexedDB操作（データ保存・取得）
- ストレージマイグレーション
- プログレス追跡
- データ永続化

**影響度**: 🔴 CRITICAL（データ損失リスク）

---

### 3. **utils.ts の残り50%** (中優先度)

**現状**: 49.26% (202/410行)

**未カバー領域**:
- 行585-616: 高度なデータ処理
- 行787-1156: 複雑なロジック

**影響度**: 🟡 MEDIUM

---

## 💡 改善提案

### Phase 1: Pythonユニットテスト実装 (2-3時間)

#### 1.1 pytest環境セットアップ
```bash
# requirements.txt に追加
pytest==7.4.3
pytest-cov==4.1.0
pytest-mock==3.12.0
```

#### 1.2 テストファイル作成

**`scripts/test_context_database.py`** (推定: 150行)
```python
import pytest
from context_database import ProjectContextDB

class TestProjectContextDB:
    @pytest.fixture
    def db(self):
        return ProjectContextDB()
    
    def test_load_workflows(self, db):
        """5つのワークフローが正しくロードされる"""
        workflows = db.get_all_workflows()
        assert len(workflows) == 5
        assert "grammar" in workflows
        assert "passage" in workflows
        assert "ui" in workflows
        assert "maintenance" in workflows
        assert "test" in workflows
    
    def test_workflow_structure(self, db):
        """各ワークフローが必須フィールドを持つ"""
        for task_type in ["grammar", "passage", "ui", "maintenance", "test"]:
            workflow = db.get_workflow(task_type)
            assert workflow is not None
            assert "name" in workflow
            assert "docs" in workflow
            assert "steps" in workflow
            assert "quality_checks" in workflow
            assert "time_estimate" in workflow
    
    def test_task_type_analysis_grammar(self, db):
        """文法タスクを正しく識別できる"""
        result = db.analyze_task_type("Grade2 Unit5の文法問題を追加")
        assert result == "grammar"
    
    def test_task_type_analysis_passage(self, db):
        """長文タスクを正しく識別できる"""
        result = db.analyze_task_type("Beginner向けの長文パッセージを作成")
        assert result == "passage"
    
    def test_task_type_analysis_ui(self, db):
        """UIタスクを正しく識別できる"""
        result = db.analyze_task_type("ダークモードのスタイルを改善")
        assert result == "ui"
    
    def test_quality_rules_data_quality(self, db):
        """品質基準が正しく定義されている"""
        rules = db.get_quality_rules("data_quality")
        assert rules["vocabulary_diversity"] == 0.80
        assert rules["subject_diversity"] == 0.60
        assert rules["choice_appropriateness"] == 0.85
    
    def test_quality_rules_performance(self, db):
        """パフォーマンス基準が定義されている"""
        rules = db.get_quality_rules("performance")
        assert rules["build_time_seconds"] == 60
        assert rules["bundle_size_mb"] == 10
```

**`scripts/test_project_ai_servant.py`** (推定: 200行)
```python
import pytest
import json
from pathlib import Path
from project_ai_servant import ProjectServant

class TestProjectServant:
    @pytest.fixture
    def servant(self):
        return ProjectServant()
    
    @pytest.fixture
    def mock_maintenance_report(self, tmp_path):
        """テスト用のメンテナンスレポートを作成"""
        report = {
            "total_issues": 10,
            "critical_issues": 2,
            "warning_issues": 5,
            "info_issues": 3,
            "timestamp": "2025-12-13T12:00:00",
            "issues": [
                {
                    "severity": "CRITICAL",
                    "category": "data_quality",
                    "description": "Test issue 1",
                    "file_path": "test.json"
                },
                {
                    "severity": "WARNING",
                    "category": "performance",
                    "description": "Test issue 2",
                    "file_path": "test2.json"
                }
            ]
        }
        
        report_path = tmp_path / "maintenance_report.json"
        with open(report_path, "w") as f:
            json.dump(report, f)
        
        return report_path
    
    def test_analyze_task_grammar(self, servant):
        """文法問題追加タスクを分析できる"""
        result = servant.analyze_task("Grade2 Unit5の文法問題を追加")
        
        assert result["type"] == "grammar"
        assert result["status"] == "ready"
        assert "workflow" in result
        assert result["workflow"]["name"] == "文法問題追加"
    
    def test_analyze_task_unknown(self, servant):
        """未知のタスクタイプに対応できる"""
        result = servant.analyze_task("何か意味不明なタスク")
        
        assert result["type"] == "unknown"
        assert "available_types" in result
    
    def test_get_context(self, servant):
        """タスクコンテキストを正しく収集できる"""
        task = servant.analyze_task("長文パッセージを作成")
        context = servant.get_context(task)
        
        assert context["task_type"] == "passage"
        assert context["task_name"] == "長文パッセージ作成"
        assert "documents" in context
        assert "steps" in context
        assert "quality_checks" in context
    
    def test_generate_checklist(self, servant):
        """実装前チェックリストを生成できる"""
        task = servant.analyze_task("UIを改善")
        checklist = servant.generate_checklist(task)
        
        assert len(checklist) > 0
        assert any("実装ステップ" in item for item in checklist)
        assert any("品質チェック" in item for item in checklist)
        assert any("最終確認" in item for item in checklist)
    
    def test_quality_status_with_report(self, servant, mock_maintenance_report, monkeypatch):
        """メンテナンスレポートから品質状態を取得できる"""
        # base_dirを一時ディレクトリに変更
        monkeypatch.setattr(servant, "base_dir", mock_maintenance_report.parent)
        
        status = servant.get_quality_status()
        
        assert status["status"] == "critical"
        assert status["total_issues"] == 10
        assert status["critical_issues"] == 2
        assert status["warning_issues"] == 5
    
    def test_quality_status_without_report(self, servant, tmp_path, monkeypatch):
        """レポートが存在しない場合のエラーハンドリング"""
        # 存在しないディレクトリを設定
        monkeypatch.setattr(servant, "base_dir", tmp_path)
        
        status = servant.get_quality_status()
        
        assert status["status"] == "unknown"
        assert "message" in status
```

**`scripts/test_maintenance_ai.py`** (推定: 150行)
```python
import pytest
from maintenance_ai import MaintenanceAI

class TestMaintenanceAI:
    @pytest.fixture
    def maintenance_ai(self):
        return MaintenanceAI()
    
    def test_check_performance_metrics(self, maintenance_ai):
        """パフォーマンスメトリクスをチェックできる"""
        # モックデータでテスト実装
        pass
    
    def test_json_report_integration(self, maintenance_ai):
        """品質神経系統のJSONレポートを読み込める"""
        # 統合テスト
        pass
```

#### 1.3 カバレッジ測定
```bash
# スクリプトディレクトリでテスト実行
cd /path/to/project
python3 -m pytest scripts/test_*.py --cov=scripts --cov-report=html --cov-report=term

# 目標カバレッジ
# - context_database.py: 80%+
# - project_ai_servant.py: 75%+
# - maintenance_ai.py: 70%+
```

---

### Phase 2: ストレージ層テスト強化 (3-4時間)

#### 2.1 IndexedDBストレージテスト

**`tests/unit/storage/indexedDBStorage.test.ts`** (新規)
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IndexedDBStorage } from '@/storage/indexedDB/indexedDBStorage';

describe('IndexedDBStorage', () => {
  let storage: IndexedDBStorage;
  
  beforeEach(async () => {
    storage = new IndexedDBStorage();
    await storage.init();
  });
  
  afterEach(async () => {
    await storage.clear();
  });
  
  it('should save and retrieve data', async () => {
    const testData = { id: 'test1', value: 'hello' };
    await storage.save('test-key', testData);
    
    const retrieved = await storage.get('test-key');
    expect(retrieved).toEqual(testData);
  });
  
  it('should handle non-existent keys', async () => {
    const result = await storage.get('non-existent');
    expect(result).toBeNull();
  });
  
  // カバレッジ目標: 70%+ (98行中68行以上)
});
```

#### 2.2 ストレージマネージャーテスト

**`tests/unit/storage/storageManager.test.ts`** (新規)
```typescript
import { describe, it, expect, vi } from 'vitest';
import { StorageManager } from '@/storage/manager/storageManager';

describe('StorageManager', () => {
  it('should switch between storage backends', () => {
    const manager = new StorageManager();
    
    // LocalStorage → IndexedDB切り替え
    manager.setBackend('indexedDB');
    expect(manager.currentBackend).toBe('indexedDB');
  });
  
  // カバレッジ目標: 60%+ (66行中40行以上)
});
```

#### 2.3 データマイグレーションテスト

**`tests/unit/storage/dataMigration.test.ts`** (新規)
```typescript
import { describe, it, expect } from 'vitest';
import { migrateData } from '@/storage/migration/dataMigration';

describe('Data Migration', () => {
  it('should migrate v1 to v2 format', () => {
    const v1Data = { version: 1, data: [] };
    const v2Data = migrateData(v1Data, 2);
    
    expect(v2Data.version).toBe(2);
  });
  
  // カバレッジ目標: 50%+ (398行中200行以上)
});
```

---

### Phase 3: utils.ts 残り部分のテスト (2時間)

#### 3.1 高度なデータ処理関数

**`tests/unit/utils-advanced.test.ts`** (新規)
```typescript
import { describe, it, expect } from 'vitest';
import { 
  selectAdaptiveQuestions,
  selectWeakQuestions,
  selectReviewQuestions
} from '@/utils';

describe('Utils - Advanced Selection', () => {
  it('should select adaptive questions based on performance', () => {
    const questions = [/* テストデータ */];
    const selected = selectAdaptiveQuestions(questions, 10);
    
    expect(selected).toHaveLength(10);
  });
  
  // カバレッジ目標: 行585-616を80%以上カバー
});
```

---

## 📊 期待されるカバレッジ改善

### 実装前 (現状)
```
TypeScript: 20.66%
Python: 0% (測定なし)
統合テスト: 52 tests (ファイル存在確認のみ)
```

### 実装後 (目標)
```
TypeScript: 45-50%
  - src/utils.ts: 70%+ (現状49% → +21%)
  - src/storage/: 50%+ (現状7-14% → +36-43%)

Python: 70-80%
  - context_database.py: 80%+
  - project_ai_servant.py: 75%+
  - maintenance_ai.py: 70%+

統合テスト: 52 tests + Pythonユニット30+ tests
総テスト数: 351 → 400+
```

---

## 🎯 優先順位付き実装計画

### 最優先 (Week 1)
1. ✅ **Pythonユニットテスト実装** (2-3時間)
   - pytest環境セットアップ
   - context_database.py テスト
   - project_ai_servant.py テスト
   
   **理由**: サーバントAIの正確性検証が最重要

### 高優先度 (Week 2)
2. ✅ **ストレージ層テスト** (3-4時間)
   - IndexedDBStorage テスト
   - StorageManager テスト
   - DataMigration テスト
   
   **理由**: データ損失防止が必須

### 中優先度 (Week 3)
3. ✅ **utils.ts 残り部分** (2時間)
   - 高度なデータ処理関数
   - 未カバー行のテスト
   
   **理由**: 既に49%あるため緊急性は低い

---

## 🚀 即座に実装できる最小限のテスト

### クイックスタート: Pythonテスト (30分)

```bash
# 1. pytestインストール
pip3 install pytest pytest-cov

# 2. シンプルなテストファイル作成
cat > scripts/test_context_database.py << 'EOF'
import pytest
from context_database import ProjectContextDB

def test_workflows_loaded():
    db = ProjectContextDB()
    workflows = db.get_all_workflows()
    assert len(workflows) == 5

def test_task_analysis():
    db = ProjectContextDB()
    result = db.analyze_task_type("文法問題を追加")
    assert result == "grammar"
EOF

# 3. テスト実行
cd /path/to/project
python3 -m pytest scripts/test_context_database.py -v

# 4. カバレッジ測定
python3 -m pytest scripts/test_context_database.py --cov=scripts --cov-report=term
```

---

## 💰 ROI分析

### 投資
- Pythonテスト: 2-3時間
- ストレージテスト: 3-4時間
- utils.tsテスト: 2時間
**合計**: 7-9時間

### リターン
1. **バグ検出**: リファクタリング時の安全性
2. **品質保証**: 商用製品レベルの信頼性
3. **開発速度**: テスト駆動開発による効率化
4. **ドキュメント**: テストがAPIドキュメントの役割

**推定ROI**: 3-5倍（1ヶ月以内に回収）

---

## 📋 チェックリスト

### Pythonテスト
- [ ] pytest環境セットアップ
- [ ] `test_context_database.py` 作成
- [ ] `test_project_ai_servant.py` 作成
- [ ] `test_maintenance_ai.py` 作成
- [ ] カバレッジ70%以上達成

### TypeScriptテスト
- [ ] `indexedDBStorage.test.ts` 作成
- [ ] `storageManager.test.ts` 作成
- [ ] `dataMigration.test.ts` 作成
- [ ] `utils-advanced.test.ts` 作成
- [ ] カバレッジ45%以上達成

### CI/CD統合
- [ ] GitHub Actions でカバレッジ自動測定
- [ ] カバレッジバッジ追加
- [ ] カバレッジ閾値設定（70%）

---

**作成日**: 2025年12月13日  
**優先度**: 🔴 CRITICAL  
**推定工数**: 7-9時間  
**期待効果**: カバレッジ 20% → 50-60%
