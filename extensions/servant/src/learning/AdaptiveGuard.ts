import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FailurePattern, FailurePatternsDB, FileHotspot, LearningStats } from './FailurePattern';
import type { Notifier } from '../ui/Notifier';
import { EventBus, ServantEvents, globalEventBus } from '../core/EventBus';

/**
 * 適応的ガードシステム
 *
 * 違反を記録し、15回のサイクルごとに自動学習を実行。
 * failure-patterns.json に記録を蓄積し、Instructions を自動更新する。
 */
export class AdaptiveGuard {
  private dbPath: string;
  private db: FailurePatternsDB;
  private context: vscode.ExtensionContext;
  private notifier?: Notifier;
  private statusUpdateCallback: ((status: string) => void) | null = null;
  private eventBus: EventBus;

  constructor(
    context: vscode.ExtensionContext,
    notifier?: Notifier,
    eventBus: EventBus = globalEventBus
  ) {
    this.context = context;
    this.notifier = notifier;
    this.eventBus = eventBus;
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
    this.dbPath = path.join(workspaceRoot, '.vscode', 'failure-patterns.json');
    this.db = this.loadDatabase();
  }

  /**
   * ステータス更新コールバックを設定
   */
  public setStatusUpdateCallback(callback: (status: string) => void): void {
    this.statusUpdateCallback = callback;
  }

  /**
   * ステータスを更新
   */
  private updateStatus(status: string): void {
    // EventBus経由で通知
    this.eventBus.emit(ServantEvents.STATUS_UPDATE, {
      message: status,
      icon: status.includes('🧠') ? '🧠' : undefined
    });

    // 後方互換性のため既存のコールバックも呼び出す
    if (this.statusUpdateCallback) {
      this.statusUpdateCallback(status);
    }
  }

  /**
   * データベースを読み込む
   */
  private loadDatabase(): FailurePatternsDB {
    if (fs.existsSync(this.dbPath)) {
      try {
        const content = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.error('Failed to load failure-patterns.json:', error);
      }
    }

    // デフォルトのデータベース
    return {
      patterns: [],
      lastUpdated: new Date().toISOString(),
      totalValidations: 0,
      currentCycleCount: 0,
      cycleSize: this.getConfig('learning.cycleSize', 15)
    };
  }

  /**
   * データベースを保存
   */
  private async saveDatabase(): Promise<void> {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2), 'utf-8');
  }

  /**
   * 設定値を取得
   */
  private getConfig<T>(key: string, defaultValue: T): T {
    return vscode.workspace.getConfiguration('servant').get(key, defaultValue);
  }

  /**
   * 違反を記録
   */
  async recordViolation(violation: {
    rule: string;
    category: string;
    filePath: string;
    message: string;
  }): Promise<void> {
    if (!this.getConfig('learning.enabled', true)) {
      return;
    }

    const pattern = this.db.patterns.find(p => p.pattern === violation.rule);

    if (pattern) {
      // 既存パターンの更新
      pattern.occurrences++;
      pattern.weight = Math.min(pattern.weight + 0.1, 1.0);
      pattern.lastOccurred = new Date().toISOString();

      // 例を追加（最大10件）
      if (pattern.examples.length < 10) {
        pattern.examples.push(`${violation.filePath}: ${violation.message}`);
      }
    } else {
      // 新規パターンの追加
      this.db.patterns.push({
        pattern: violation.rule,
        category: violation.category,
        occurrences: 1,
        weight: 0.5,
        lastOccurred: new Date().toISOString(),
        examples: [`${violation.filePath}: ${violation.message}`],
        recoveries: 0,
        successRate: 0,
        description: violation.message,
        affectedFiles: [violation.filePath]
      });
    }

    this.db.totalValidations++;
    this.db.currentCycleCount++;

    await this.saveDatabase();
    await this.checkLearningCycle();
  }

  /**
   * 復旧を記録（違反が修正された場合）
   */
  async recordRecovery(patternName: string): Promise<void> {
    const pattern = this.db.patterns.find(p => p.pattern === patternName);

    if (pattern) {
      pattern.recoveries++;
      pattern.weight = Math.max(pattern.weight - 0.05, 0.1);
      pattern.successRate = pattern.recoveries / pattern.occurrences;

      await this.saveDatabase();
    }
  }

  /**
   * 学習サイクルをチェック
   */
  async checkLearningCycle(): Promise<void> {
    if (this.db.currentCycleCount >= this.db.cycleSize) {
      await this.triggerLearning();
    }
  }

  /**
   * 学習を実行
   */
  async triggerLearning(): Promise<void> {
    this.updateStatus('🧠 学習中...');
    console.log('🧠 Adaptive Learning: Starting learning cycle...');

    // 高リスクパターンを抽出（weight >= 0.7）
    const highRiskPatterns = this.db.patterns
      .filter(p => p.weight >= 0.7)
      .sort((a, b) => b.weight - a.weight);

    // レポートを生成して保存（バックアップ用）
    await this.generateLearningReport(highRiskPatterns);

    // カウントリセット
    this.db.currentCycleCount = 0;
    await this.saveDatabase();

    // 学習完了イベントを発行
    this.eventBus.emit(ServantEvents.LEARNING_COMPLETED, {
      patterns: highRiskPatterns.length
    });

    this.updateStatus(`✅ 学習完了 (${highRiskPatterns.length}パターン)`);
    console.log('✅ Adaptive Learning: Learning cycle completed');

    // 外部から設定されたコールバックを呼び出し（ChatParticipantに通知）
    if (this.onLearningComplete) {
      await this.onLearningComplete(highRiskPatterns);
    }
  }

  private onLearningComplete?: (patterns: FailurePattern[]) => Promise<void>;

  /**
   * 学習完了時のコールバックを設定
   */
  public setOnLearningComplete(callback: (patterns: FailurePattern[]) => Promise<void>): void {
    this.onLearningComplete = callback;
  }

  /**
   * 学習レポートを生成（承認待ち）
   */
  private async generateLearningReport(patterns: FailurePattern[]): Promise<void> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceRoot) {
      return;
    }

    const reportPath = path.join(workspaceRoot, '.vscode', 'adaptive-learning-report.md');
    const date = new Date().toISOString();

    let content = `# 🧠 適応学習レポート

**生成日時**: ${date}
**検出パターン数**: ${patterns.length}個
**総検証回数**: ${this.db.totalValidations}回

---

## 📊 検出された高リスクパターン

`;

    if (patterns.length === 0) {
      content += '現時点で高リスクパターンは検出されていません。\n\n';
    } else {
      patterns.forEach((pattern, index) => {
        content += `### ${index + 1}. ${pattern.pattern}\n\n`;
        content += `- **カテゴリ**: ${pattern.category}\n`;
        content += `- **発生回数**: ${pattern.occurrences}回\n`;
        content += `- **リスクスコア**: ${(pattern.weight * 100).toFixed(0)}%\n`;
        content += `- **復旧成功率**: ${(pattern.successRate * 100).toFixed(0)}%\n\n`;

        if (pattern.description) {
          content += `**説明**: ${pattern.description}\n\n`;
        }

        if (pattern.examples.length > 0) {
          content += `**直近の例**:\n`;
          pattern.examples.slice(0, 3).forEach(example => {
            content += `- ${example}\n`;
          });
          content += '\n';
        }
      });
    }

    content += `---

## ✅ 承認欄

このレポートの内容を確認し、Instructionsへの反映を承認する場合は、
以下の行を **APPROVED: y** に変更してください。

\`\`\`
APPROVED: n
\`\`\`

保存すると、Servantが自動的にInstructionsファイルを更新します。

---

**レポートパス**: \`${reportPath}\`
**Instructions生成先**: \`.aitk/instructions/adaptive-learned-patterns.instructions.md\`
`;

    // ディレクトリ作成
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // レポート保存
    fs.writeFileSync(reportPath, content, 'utf-8');
    console.log(`📝 Learning report generated: ${reportPath}`);
  }

  /**
   * レポートの承認状態をチェックして、承認済みならInstructionsを更新
   */
  async checkAndApplyReport(): Promise<void> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceRoot) {
      return;
    }

    const reportPath = path.join(workspaceRoot, '.vscode', 'adaptive-learning-report.md');

    if (!fs.existsSync(reportPath)) {
      return;
    }

    const content = fs.readFileSync(reportPath, 'utf-8');

    // 承認チェック（APPROVED: y を検索）
    if (!/APPROVED:\s*y/i.test(content)) {
      return;
    }

    console.log('✅ Learning report approved. Applying changes...');

    // 高リスクパターンを再取得
    const highRiskPatterns = this.db.patterns
      .filter(p => p.weight >= 0.7)
      .sort((a, b) => b.weight - a.weight);

    // Instructions更新
    await this.updateInstructions(highRiskPatterns);

    // レポートをアーカイブ（適用済みマーク）
    const archivePath = reportPath.replace('.md', `.applied-${Date.now()}.md`);
    fs.renameSync(reportPath, archivePath);

    this.notifier?.commandInfo(
      `✅ 学習内容をInstructionsに反映しました（${highRiskPatterns.length}パターン）`,
      'Instructionsを確認'
    );

    console.log(`✅ Learning applied and report archived: ${archivePath}`);
  }

  /**
   * Instructions を自動更新（Chat承認後に呼ばれる）
   */
  async updateInstructions(patterns: FailurePattern[]): Promise<void> {
    if (patterns.length === 0) {
      return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceRoot) {
      return;
    }

    const instructionsDir = path.join(workspaceRoot, '.aitk', 'instructions');
    const adaptiveFile = path.join(instructionsDir, 'adaptive-learned-patterns.instructions.md');

    // Instructions コンテンツ生成
    const content = this.generateInstructionsContent(patterns);

    // ディレクトリ作成
    if (!fs.existsSync(instructionsDir)) {
      fs.mkdirSync(instructionsDir, { recursive: true });
    }

    // ファイル書き込み
    fs.writeFileSync(adaptiveFile, content, 'utf-8');

    console.log(`📝 Updated: ${adaptiveFile}`);
  }

  /**
   * Instructions コンテンツを生成
   */
  private generateInstructionsContent(patterns: FailurePattern[]): string {
    const date = new Date().toISOString().split('T')[0];

    let content = `---
description: 適応的学習で抽出された高頻度違反パターン（自動生成）
applyTo: '**'
lastUpdated: ${date}
---

# 🧠 学習済み高リスクパターン

このファイルは Servant が自動学習で生成しました。
以下のパターンは過去に頻繁に違反が発生したため、特に注意が必要です。

---

`;

    patterns.forEach((pattern, index) => {
      content += `## ${index + 1}. ${pattern.pattern}\n\n`;
      content += `- **カテゴリ**: ${pattern.category}\n`;
      content += `- **発生回数**: ${pattern.occurrences}回\n`;
      content += `- **リスク**: ${(pattern.weight * 100).toFixed(0)}%\n`;
      content += `- **復旧成功率**: ${(pattern.successRate * 100).toFixed(0)}%\n\n`;

      if (pattern.description) {
        content += `**説明**: ${pattern.description}\n\n`;
      }

      if (pattern.examples.length > 0) {
        content += `**直近の例**:\n`;
        pattern.examples.slice(0, 3).forEach(example => {
          content += `- ${example}\n`;
        });
        content += '\n';
      }

      content += '---\n\n';
    });

    content += `**最終学習日時**: ${new Date().toISOString()}\n`;
    content += `**総検証回数**: ${this.db.totalValidations}\n`;

    return content;
  }

  /**
   * ホットスポットを取得
   */
  getHotspots(): FileHotspot[] {
    const fileMap = new Map<string, { count: number; patterns: Map<string, number> }>();

    // ファイルごとに違反を集計
    this.db.patterns.forEach(pattern => {
      pattern.affectedFiles?.forEach(file => {
        if (!fileMap.has(file)) {
          fileMap.set(file, { count: 0, patterns: new Map() });
        }

        const fileData = fileMap.get(file)!;
        fileData.count += pattern.occurrences;
        fileData.patterns.set(pattern.pattern, (fileData.patterns.get(pattern.pattern) || 0) + pattern.occurrences);
      });
    });

    // ホットスポット配列に変換
    const hotspots: FileHotspot[] = [];
    fileMap.forEach((data, file) => {
      const topPatterns = Array.from(data.patterns.entries())
        .map(([pattern, count]) => ({ pattern, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      hotspots.push({
        file,
        violationCount: data.count,
        topPatterns,
        riskScore: Math.min(data.count * 10, 100),
        lastViolation: new Date().toISOString()
      });
    });

    return hotspots.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * 学習統計を取得
   */
  getStats(): LearningStats {
    const highRiskCount = this.db.patterns.filter(p => p.weight >= 0.7).length;
    const avgSuccessRate = this.db.patterns.length > 0
      ? this.db.patterns.reduce((sum, p) => sum + p.successRate, 0) / this.db.patterns.length
      : 0;

    return {
      totalPatterns: this.db.patterns.length,
      highRiskPatterns: highRiskCount,
      averageSuccessRate: avgSuccessRate,
      validationsUntilNextLearning: this.db.cycleSize - this.db.currentCycleCount,
      totalLearningCycles: Math.floor(this.db.totalValidations / this.db.cycleSize),
      lastLearningDate: this.db.lastUpdated
    };
  }

  /**
   * 学習データをリセット
   */
  async resetLearning(): Promise<void> {
    this.db = {
      patterns: [],
      lastUpdated: new Date().toISOString(),
      totalValidations: 0,
      currentCycleCount: 0,
      cycleSize: this.getConfig('learning.cycleSize', 15)
    };

    await this.saveDatabase();
    this.notifier?.commandInfo('🔄 Servant: 学習データをリセットしました');
  }
}
