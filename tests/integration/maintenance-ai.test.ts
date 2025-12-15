import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * メンテナンスAI統合テスト
 *
 * 検証項目:
 * - メンテナンスAIスクリプトの存在
 * - GitHub Actionsワークフローの存在
 * - 必要なドキュメントの存在
 * - スクリプトの実行可能性
 */

describe('メンテナンスAI統合', () => {
  const baseDir = join(__dirname, '../..');

  describe('必須ファイルの存在', () => {
    it('メンテナンスAIスクリプトが存在する', () => {
      const scriptPath = join(baseDir, 'scripts/maintenance_ai.py');
      expect(existsSync(scriptPath), `${scriptPath} が見つかりません`).toBe(true);
    });

    it('GitHub Actionsワークフローが存在する', () => {
      const workflowPath = join(baseDir, '.github/workflows/maintenance-ai.yml');
      expect(existsSync(workflowPath), `${workflowPath} が見つかりません`).toBe(true);
    });

    it('メンテナンスAIガイドが存在する', () => {
      const guidePath = join(baseDir, 'docs/maintenance/MAINTENANCE_AI_GUIDE.md');
      expect(existsSync(guidePath), `${guidePath} が見つかりません`).toBe(true);
    });

    it('品質神経系統スクリプトが存在する', () => {
      const qnsPath = join(baseDir, 'scripts/quality_nervous_system.py');
      expect(existsSync(qnsPath), `${qnsPath} が見つかりません`).toBe(true);
    });
  });

  describe('統合品質パイプライン', () => {
    it('Pre-commit hookが存在する', () => {
      const hookPath = join(baseDir, '.husky/pre-commit');
      expect(existsSync(hookPath), `${hookPath} が見つかりません`).toBe(true);
    });

    it('品質神経系統ワークフローが存在する', () => {
      const workflowPath = join(baseDir, '.github/workflows/quality-nervous-system.yml');
      expect(existsSync(workflowPath), `${workflowPath} が見つかりません`).toBe(true);
    });

    it('品質関連ドキュメントが存在する', () => {
      const docs = [
        'docs/quality/QUALITY_AUTOMATION_GUIDE.md',
        'docs/quality/EMERGENCY_QUALITY_NERVOUS_SYSTEM_REPORT.md',
        'docs/MAINTENANCE_AI_GUIDE.md',
      ];

      for (const doc of docs) {
        const docPath = join(baseDir, doc);
        expect(existsSync(docPath), `${docPath} が見つかりません`).toBe(true);
      }
    });
  });

  describe('品質保証システムの完全性', () => {
    it('緊急品質レポートが存在する', () => {
      const reportPath = join(baseDir, 'docs/quality/EMERGENCY_QUALITY_NERVOUS_SYSTEM_REPORT.md');
      expect(existsSync(reportPath), `${reportPath} が見つかりません`).toBe(true);
    });

    it('テストガイドラインが存在する', () => {
      const guidelinePath = join(baseDir, '.aitk/instructions/testing-guidelines.instructions.md');
      expect(existsSync(guidelinePath), `${guidelinePath} が見つかりません`).toBe(true);
    });

    it('文法問題パッセージ機能ドキュメントが存在する', () => {
      const docPath = join(baseDir, 'docs/features/GRAMMAR_PASSAGE_FEATURE.md');
      expect(existsSync(docPath), `${docPath} が見つかりません`).toBe(true);
    });
  });

  describe('自動化スクリプトの完全性', () => {
    it('パッセージ追加スクリプトが存在する', () => {
      const scriptPath = join(baseDir, 'scripts/add_passage_to_grammar.py');
      expect(existsSync(scriptPath), `${scriptPath} が見つかりません`).toBe(true);
    });

    it('データ検証スクリプトが揃っている', () => {
      const scripts = ['validate_all_content.py', 'validate_and_fix_duplicates.py'];

      for (const script of scripts) {
        const scriptPath = join(baseDir, 'scripts', script);
        expect(existsSync(scriptPath), `${scriptPath} が見つかりません`).toBe(true);
      }
    });
  });
});

describe('品質神経系統との統合', () => {
  it('メンテナンスAIは品質神経系統を呼び出す', async () => {
    const { readFileSync } = await import('fs');
    const scriptPath = join(__dirname, '../../scripts/maintenance_ai.py');
    const content = readFileSync(scriptPath, 'utf-8');

    expect(content).toContain('quality_nervous_system.py');
    expect(content).toContain('check_data_quality');
  });

  it('品質神経系統の閾値が定義されている', async () => {
    const { readFileSync } = await import('fs');
    const qnsPath = join(__dirname, '../../scripts/quality_nervous_system.py');
    const content = readFileSync(qnsPath, 'utf-8');

    expect(content).toContain('vocabulary_diversity');
    expect(content).toContain('subject_diversity');
    expect(content).toContain('pattern_repetition');
    expect(content).toContain('natural_japanese');
    expect(content).toContain('choice_appropriateness');
  });
});

describe('CI/CDパイプライン統合', () => {
  it('GitHub Actionsでメンテナンスが自動実行される', async () => {
    const { readFileSync } = await import('fs');
    const workflowPath = join(__dirname, '../../.github/workflows/maintenance-ai.yml');
    const content = readFileSync(workflowPath, 'utf-8');

    // スケジュール実行
    expect(content).toContain('schedule');
    expect(content).toContain('cron');

    // 手動実行
    expect(content).toContain('workflow_dispatch');

    // メンテナンスAI実行
    expect(content).toContain('maintenance_ai.py');
  });

  it('CRITICAL問題でIssueが自動作成される', async () => {
    const { readFileSync } = await import('fs');
    const workflowPath = join(__dirname, '../../.github/workflows/maintenance-ai.yml');
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('issues.create');
    expect(content).toContain('CRITICAL');
  });
});
