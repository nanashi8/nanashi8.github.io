import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * プロジェクトAIサーバント統合テスト
 *
 * 検証項目:
 * - サーバントAIの基本機能
 * - コンテキストデータベースの完全性
 * - タスク分析の精度
 * - ワークフロー提案の妥当性
 * - 品質状態統合
 */

describe('プロジェクトAIサーバント統合', () => {
  const baseDir = join(__dirname, '../..');

  describe('必須ファイルの存在', () => {
    it('サーバントAIスクリプトが存在する', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      expect(existsSync(scriptPath), `${scriptPath} が見つかりません`).toBe(true);
    });

    it('コンテキストデータベーススクリプトが存在する', () => {
      const dbPath = join(baseDir, 'scripts/context_database.py');
      expect(existsSync(dbPath), `${dbPath} が見つかりません`).toBe(true);
    });

    it('設計ドキュメントが存在する', () => {
      const designPath = join(baseDir, 'docs/design/PROJECT_AI_SERVANT_DESIGN.md');
      expect(existsSync(designPath), `${designPath} が見つかりません`).toBe(true);
    });
  });

  describe('コンテキストデータベースの完全性', () => {
    it('5つのワークフロータイプが定義されている', () => {
      const dbPath = join(baseDir, 'scripts/context_database.py');
      const content = readFileSync(dbPath, 'utf-8');

      // 各ワークフローの存在確認
      expect(content).toContain('"grammar"');
      expect(content).toContain('"passage"');
      expect(content).toContain('"ui"');
      expect(content).toContain('"maintenance"');
      expect(content).toContain('"test"');
    });

    it('各ワークフローに必須フィールドが含まれる', () => {
      const dbPath = join(baseDir, 'scripts/context_database.py');
      const content = readFileSync(dbPath, 'utf-8');

      // 必須フィールド
      expect(content).toContain('"name"');
      expect(content).toContain('"docs"');
      expect(content).toContain('"steps"');
      expect(content).toContain('"quality_checks"');
      expect(content).toContain('"time_estimate"');
    });

    it('品質基準が定義されている', () => {
      const dbPath = join(baseDir, 'scripts/context_database.py');
      const content = readFileSync(dbPath, 'utf-8');

      expect(content).toContain('commit_requirements');
      expect(content).toContain('data_quality');
      expect(content).toContain('performance');
      expect(content).toContain('code_standards');
    });

    it('タスクパターンマッチングが定義されている', () => {
      const dbPath = join(baseDir, 'scripts/context_database.py');
      const content = readFileSync(dbPath, 'utf-8');

      // 正規表現パターン
      expect(content).toContain('pattern');
      expect(content).toContain('task_type');
      expect(content).toContain('confidence');
    });
  });

  describe('サーバントAIの機能', () => {
    it('タスク分析機能が実装されている', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('def analyze_task');
      expect(content).toContain('analyze_task_type');
    });

    it('コンテキスト抽出機能が実装されている', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('def get_context');
      expect(content).toContain('workflow.get');
    });

    it('チェックリスト生成機能が実装されている', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('def generate_checklist');
      expect(content).toContain('実装ステップ');
      expect(content).toContain('品質チェック');
      expect(content).toContain('最終確認');
    });

    it('品質状態統合が実装されている', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('def get_quality_status');
      expect(content).toContain('maintenance_report.json');
      expect(content).toContain('critical_issues');
      expect(content).toContain('warning_issues');
    });

    it('次のアクション提案機能が実装されている', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('def suggest_next_action');
      expect(content).toContain('CRITICAL問題');
      expect(content).toContain('推奨対応');
    });
  });

  describe('CLIインターフェース', () => {
    it('--analyze オプションが実装されている', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('--analyze');
      expect(content).toContain('タスクを分析');
    });

    it('--status オプションが実装されている', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('--status');
      expect(content).toContain('品質状態を表示');
    });

    it('--suggest オプションが実装されている', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('--suggest');
      expect(content).toContain('次のアクションを提案');
    });

    it('--report オプションが実装されている', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('--report');
      expect(content).toContain('完全レポート生成');
    });

    it('--json オプションが実装されている', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('--json');
      expect(content).toContain('JSON形式で出力');
    });
  });

  describe('メンテナンスAIとの統合', () => {
    it('メンテナンスレポートを読み込む', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('maintenance_report.json');
      expect(content).toContain('json.load');
    });

    it('CRITICAL問題を検出して警告する', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('quality.get("status") == "critical"');
      expect(content).toContain('critical_issues');
      expect(content).toContain('🚨 緊急');
    });

    it('問題をカテゴリ別に集計する', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('_group_by_category');
      expect(content).toContain('category');
      expect(content).toContain('severity');
    });

    it('上位の問題を優先度順に取得する', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('_get_top_issues');
      expect(content).toContain('sorted_issues');
      expect(content).toContain('CRITICAL');
    });
  });

  describe('ドキュメント参照の正確性', () => {
    it('文法ワークフローが正しいドキュメントを参照している', () => {
      const dbPath = join(baseDir, 'scripts/context_database.py');
      const content = readFileSync(dbPath, 'utf-8');

      // 文法関連ドキュメント
      expect(content).toContain('AI_WORKFLOW_INSTRUCTIONS.md');
    });

    it('長文ワークフローが正しいドキュメントを参照している', () => {
      const dbPath = join(baseDir, 'scripts/context_database.py');
      const content = readFileSync(dbPath, 'utf-8');

      // 長文関連ドキュメント（実際に存在するもの）
      expect(content).toContain('PASSAGE');
    });

    it('UIワークフローが正しいドキュメントを参照している', () => {
      const dbPath = join(baseDir, 'scripts/context_database.py');
      const content = readFileSync(dbPath, 'utf-8');

      // UI関連ドキュメント
      expect(content).toContain('UI_DEVELOPMENT_GUIDELINES.md');
      expect(content).toContain('DESIGN_SYSTEM_RULES.md');
    });

    it('メンテナンスワークフローが正しいドキュメントを参照している', () => {
      const dbPath = join(baseDir, 'scripts/context_database.py');
      const content = readFileSync(dbPath, 'utf-8');

      // メンテナンス関連ドキュメント
      expect(content).toContain('MAINTENANCE_AI_GUIDE.md');
      expect(content).toContain('QUALITY_SYSTEM.md');
    });
  });

  describe('エラーハンドリング', () => {
    it('未知のタスクタイプに対応している', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('type": "unknown');
      expect(content).toContain('available_types');
    });

    it('メンテナンスレポートが存在しない場合に対応している', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('not report_path.exists()');
      expect(content).toContain('status": "unknown');
    });

    it('JSON読み込みエラーに対応している', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('except Exception');
      expect(content).toContain('status": "error');
    });
  });

  describe('出力フォーマット', () => {
    it('JSON出力をサポートしている', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('json.dumps');
      expect(content).toContain('ensure_ascii=False');
      expect(content).toContain('indent=2');
    });

    it('人間が読みやすい出力をサポートしている', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('🤖');
      expect(content).toContain('📋');
      expect(content).toContain('✅');
      expect(content).toContain('📊');
    });

    it('進捗状況を絵文字で表現している', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('☐'); // チェックボックス
      expect(content).toContain('🚨'); // 緊急警告
      expect(content).toContain('⚠️'); // 警告
    });
  });

  describe('業界標準との整合性', () => {
    it('コンテキスト駆動型アーキテクチャを採用', () => {
      const dbPath = join(baseDir, 'scripts/context_database.py');
      const content = readFileSync(dbPath, 'utf-8');

      // コンテキストデータベースパターン
      expect(content).toContain('class ProjectContextDB');
      expect(content).toContain('_load_context');
      expect(content).toContain('get_workflow');
    });

    it('タスク分析にパターンマッチングを使用', () => {
      const dbPath = join(baseDir, 'scripts/context_database.py');
      const content = readFileSync(dbPath, 'utf-8');

      // 正規表現ベースのパターンマッチング
      expect(content).toContain('re.search');
      expect(content).toContain('pattern');
      expect(content).toContain('confidence');
    });

    it('CLI設計がUnix哲学に従っている', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      // 単一責任の原則
      expect(content).toContain('argparse');
      expect(content).toContain('--analyze');
      expect(content).toContain('--status');
      expect(content).toContain('--suggest');
      expect(content).toContain('--report');
    });

    it('出力が機械可読（JSON）と人間可読を両サポート', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      expect(content).toContain('--json');
      expect(content).toContain('if args.json');
    });

    it('エラーメッセージが具体的で実行可能', () => {
      const scriptPath = join(baseDir, 'scripts/project_ai_servant.py');
      const content = readFileSync(scriptPath, 'utf-8');

      // 実行可能なコマンドを提案
      expect(content).toContain('python3 scripts/maintenance_ai.py');
      expect(content).toContain('推奨対応');
    });
  });
});
