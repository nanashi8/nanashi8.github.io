import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { ValidationCache } from './ValidationCache';
import { RuleEngine, Violation } from '../engine/RuleEngine';
import { InstructionsLoader } from '../loader/InstructionsLoader';

/**
 * IncrementalValidator
 *
 * 変更されたファイルのみを検証し、パフォーマンスを向上させる。
 * - ファイル変更検出
 * - キャッシュ統合
 * - 効率的な検証
 */
export class IncrementalValidator {
  private cache: ValidationCache;
  private ruleEngine: RuleEngine;
  private instructionsLoader: InstructionsLoader;
  private outputChannel: vscode.OutputChannel;
  private fileHashes: Map<string, string>;

  constructor(
    cache: ValidationCache,
    ruleEngine: RuleEngine,
    instructionsLoader: InstructionsLoader,
    outputChannel: vscode.OutputChannel
  ) {
    this.cache = cache;
    this.ruleEngine = ruleEngine;
    this.instructionsLoader = instructionsLoader;
    this.outputChannel = outputChannel;
    this.fileHashes = new Map();
  }

  /**
   * ファイルを増分検証
   *
   * @param files - 検証するファイルパス配列
   * @returns 検証結果
   */
  async validateIncremental(files: string[]): Promise<Map<string, Violation[]>> {
    this.outputChannel.appendLine('[Incremental] Starting incremental validation...');
    this.outputChannel.appendLine(`[Incremental] Files to validate: ${files.length}`);

    const results = new Map<string, Violation[]>();
    let cacheHits = 0;
    let cacheMisses = 0;

    for (const filePath of files) {
      try {
        // ファイルを読み込み
        const uri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(uri);
        const content = document.getText();

        // キャッシュをチェック
        const cached = await this.cache.get(filePath, content);

        if (cached) {
          // キャッシュヒット
          cacheHits++;
          this.outputChannel.appendLine(`[Incremental] Cache hit: ${filePath}`);

          // CachedResultをViolation[]に変換
          const violations: Violation[] = cached.violations.map(v => ({
            range: new vscode.Range(v.line, 0, v.line, 100),
            message: v.message,
            severity: v.severity as 'error' | 'warning',
            ruleId: 'cached'
          }));

          results.set(filePath, violations);
        } else {
          // キャッシュミス - 新規検証
          cacheMisses++;
          this.outputChannel.appendLine(`[Incremental] Cache miss: ${filePath}`);

          const instructions = this.instructionsLoader.getInstructions();
          const violations = this.ruleEngine.validate(document, instructions);

          results.set(filePath, violations);

          // キャッシュに保存
          const cachedViolations = violations.map(v => ({
            line: v.range.start.line,
            message: v.message,
            severity: v.severity as 'error' | 'warning'
          }));

          await this.cache.set(filePath, content, cachedViolations);
        }
      } catch (error) {
        this.outputChannel.appendLine(`[Incremental] Error validating ${filePath}: ${error}`);
        results.set(filePath, []);
      }
    }

    const hitRate = files.length > 0 ? (cacheHits / files.length * 100).toFixed(1) : '0.0';
    this.outputChannel.appendLine(`[Incremental] Cache hits: ${cacheHits}, misses: ${cacheMisses} (${hitRate}% hit rate)`);

    return results;
  }

  /**
   * 変更されたファイルを検出
   *
   * @param files - チェックするファイル配列
   * @returns 変更されたファイルのみ
   */
  async getChangedFiles(files: string[]): Promise<string[]> {
    const changedFiles: string[] = [];

    for (const filePath of files) {
      if (await this.hasFileChanged(filePath)) {
        changedFiles.push(filePath);
      }
    }

    this.outputChannel.appendLine(`[Incremental] Changed files: ${changedFiles.length}/${files.length}`);
    return changedFiles;
  }

  /**
   * ファイルが変更されたかチェック
   *
   * @param filePath - ファイルパス
   * @returns 変更されていればtrue
   */
  private async hasFileChanged(filePath: string): Promise<boolean> {
    try {
      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      const content = document.getText();

      const currentHash = this.generateHash(content);
      const previousHash = this.fileHashes.get(filePath);

      if (!previousHash || previousHash !== currentHash) {
        this.fileHashes.set(filePath, currentHash);
        return true;
      }

      return false;
    } catch {
      // エラーの場合は変更ありとして扱う
      return true;
    }
  }

  /**
   * ファイル内容からハッシュを生成
   */
  private generateHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * ファイルハッシュをリセット（全ファイルを再検証させる）
   */
  resetHashes(): void {
    this.fileHashes.clear();
    this.outputChannel.appendLine('[Incremental] File hashes reset');
  }

  /**
   * 特定のファイルのハッシュを無効化
   */
  invalidateFile(filePath: string): void {
    this.fileHashes.delete(filePath);
    this.cache.invalidate(filePath);
    this.outputChannel.appendLine(`[Incremental] Invalidated: ${filePath}`);
  }

  /**
   * 統計情報を取得
   */
  getStats(): {
    trackedFiles: number;
    cacheStats: ReturnType<ValidationCache['getStats']>;
  } {
    return {
      trackedFiles: this.fileHashes.size,
      cacheStats: this.cache.getStats()
    };
  }
}
