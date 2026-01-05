import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * ファイルの変更統計
 */
export interface FileChangeStats {
  /** ファイルパス（相対パス） */
  filePath: string;
  /** 総コミット数 */
  totalCommits: number;
  /** 過去30日のコミット数 */
  commitsLast30Days: number;
  /** 過去7日のコミット数 */
  commitsLast7Days: number;
  /** 最終コミット日時 */
  lastCommitDate: Date | null;
  /** 変更頻度（0-1、高いほど活発） */
  changeFrequency: number;
}

/**
 * GitIntegration
 *
 * Gitリポジトリとの統合機能を提供します。
 * - リポジトリの検出
 * - staged filesの取得
 * - Git操作のヘルパー
 */
export class GitIntegration {
  private outputChannel: vscode.OutputChannel;

  private resolveGitExecutable(): string {
    // Prefer explicit path when available (macOS default)
    const envGit = process.env.GIT_EXECUTABLE;
    if (envGit && envGit.trim().length > 0) {
      return envGit;
    }

    if (process.platform === 'darwin' && fs.existsSync('/usr/bin/git')) {
      return '/usr/bin/git';
    }

    return 'git';
  }

  private execGit(
    workspaceRoot: string,
    args: string[],
    options?: { maxBuffer?: number }
  ): Promise<{ stdout: string; stderr: string }> {
    const git = this.resolveGitExecutable();
    return execFileAsync(git, ['-C', workspaceRoot, ...args], {
      maxBuffer: options?.maxBuffer,
    }) as unknown as Promise<{ stdout: string; stderr: string }>;
  }

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  /**
   * ワークスペースがGitリポジトリかどうかを確認
   *
   * @param workspaceRoot - ワークスペースのルートパス
   * @returns Gitリポジトリならtrue
   */
  async isGitRepository(workspaceRoot: string): Promise<boolean> {
    try {
      const { stdout } = await this.execGit(workspaceRoot, ['rev-parse', '--is-inside-work-tree']);
      return stdout.trim() === 'true';
    } catch {
      this.outputChannel.appendLine(`[Git] Not a git repository (root=${workspaceRoot})`);
      return false;
    }
  }

  /**
   * .git/hooksディレクトリのパスを取得
   *
   * @param workspaceRoot - ワークスペースのルートパス
   * @returns .git/hooksディレクトリの絶対パス
   */
  async getHooksDirectory(workspaceRoot: string): Promise<string | null> {
    try {
      const { stdout } = await this.execGit(workspaceRoot, ['rev-parse', '--git-dir']);

      const gitDir = stdout.trim();
      const hooksDir = path.isAbsolute(gitDir)
        ? path.join(gitDir, 'hooks')
        : path.join(workspaceRoot, gitDir, 'hooks');

      return hooksDir;
    } catch (error) {
      this.outputChannel.appendLine(`[Git] Error getting hooks directory: ${error}`);
      return null;
    }
  }

  /**
   * staged状態のファイルを取得
   *
   * @param workspaceRoot - ワークスペースのルートパス
   * @returns staged filesの絶対パス配列
   */
  async getStagedFiles(workspaceRoot: string): Promise<string[]> {
    try {
      const isRepo = await this.isGitRepository(workspaceRoot);
      if (!isRepo) {
        return [];
      }

      // Use --staged for compatibility and to avoid option parsing surprises
      const { stdout } = await this.execGit(workspaceRoot, ['diff', '--staged', '--name-only']);

      if (!stdout.trim()) {
        this.outputChannel.appendLine('[Git] No staged files found');
        return [];
      }

      // 相対パスを絶対パスに変換
      const relativePaths = stdout
        .trim()
        .split('\n')
        .filter((p) => p.length > 0);
      const absolutePaths = relativePaths.map((p) => path.join(workspaceRoot, p));

      this.outputChannel.appendLine(`[Git] Found ${absolutePaths.length} staged files`);
      return absolutePaths;
    } catch (error) {
      this.outputChannel.appendLine(`[Git] Error getting staged files: ${error}`);
      return [];
    }
  }

  /**
   * 特定のファイルがstagedかどうかを確認
   *
   * @param filePath - チェックするファイルの絶対パス
   * @param workspaceRoot - ワークスペースのルートパス
   * @returns stagedならtrue
   */
  async isFileStaged(filePath: string, workspaceRoot: string): Promise<boolean> {
    const stagedFiles = await this.getStagedFiles(workspaceRoot);
    return stagedFiles.includes(filePath);
  }

  /**
   * .instructions.mdファイルのみをフィルタリング
   *
   * @param files - ファイルパス配列
   * @returns .instructions.mdファイルのみの配列
   */
  filterInstructionsFiles(files: string[]): string[] {
    return files.filter((file) => file.endsWith('.instructions.md'));
  }

  /**
   * Gitのルートディレクトリを取得
   *
   * @param workspaceRoot - ワークスペースのルートパス
   * @returns Gitルートディレクトリの絶対パス
   */
  async getGitRoot(workspaceRoot: string): Promise<string | null> {
    try {
      const { stdout } = await this.execGit(workspaceRoot, ['rev-parse', '--show-toplevel']);

      return stdout.trim();
    } catch (error) {
      this.outputChannel.appendLine(`[Git] Error getting git root: ${error}`);
      return null;
    }
  }

  /**
   * 現在のブランチ名を取得
   *
   * @param workspaceRoot - ワークスペースのルートパス
   * @returns ブランチ名
   */
  async getCurrentBranch(workspaceRoot: string): Promise<string | null> {
    try {
      const { stdout } = await this.execGit(workspaceRoot, ['rev-parse', '--abbrev-ref', 'HEAD']);

      return stdout.trim();
    } catch (error) {
      this.outputChannel.appendLine(`[Git] Error getting current branch: ${error}`);
      return null;
    }
  }

  /**
   * 指定したファイルをstageに追加
   *
   * @param filePath - ファイルの絶対パス
   * @param workspaceRoot - ワークスペースのルートパス
   */
  async stageFile(filePath: string, workspaceRoot: string): Promise<boolean> {
    try {
      const relativePath = path.relative(workspaceRoot, filePath);
      await this.execGit(workspaceRoot, ['add', '--', relativePath]);

      this.outputChannel.appendLine(`[Git] Staged file: ${relativePath}`);
      return true;
    } catch (error) {
      this.outputChannel.appendLine(`[Git] Error staging file: ${error}`);
      return false;
    }
  }

  /**
   * コミットメッセージを取得（commit-msg hook用）
   *
   * @param commitMsgFile - .git/COMMIT_EDITMSGファイルのパス
   * @returns コミットメッセージ
   */
  async getCommitMessage(commitMsgFile: string): Promise<string | null> {
    try {
      const uri = vscode.Uri.file(commitMsgFile);
      const document = await vscode.workspace.openTextDocument(uri);
      return document.getText();
    } catch (error) {
      this.outputChannel.appendLine(`[Git] Error reading commit message: ${error}`);
      return null;
    }
  }

  /**
   * VSCode SCM APIを使用してstaged filesを取得
   * （より信頼性が高い方法）
   *
   * @returns staged filesの絶対パス配列
   */
  async getStagedFilesFromSCM(): Promise<string[]> {
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    if (!gitExtension) {
      this.outputChannel.appendLine('[Git] VSCode Git extension not found');
      return [];
    }

    if (!gitExtension.isActive) {
      await gitExtension.activate();
    }

    const git = gitExtension.exports.getAPI(1);
    if (!git || git.repositories.length === 0) {
      this.outputChannel.appendLine('[Git] No git repositories found');
      return [];
    }

    const repository = git.repositories[0];
    const stagedFiles: string[] = [];

    // indexChanges = staged changes
    for (const change of repository.state.indexChanges) {
      if (change.uri) {
        stagedFiles.push(change.uri.fsPath);
      }
    }

    this.outputChannel.appendLine(`[Git] Found ${stagedFiles.length} staged files via SCM API`);
    return stagedFiles;
  }

  /**
   * 作業ツリー上の変更ファイルを取得（未ステージ + untracked）
   *
   * @param workspaceRoot - ワークスペースのルートパス
   * @returns 変更ファイルの絶対パス配列
   */
  async getWorkingTreeFiles(workspaceRoot: string): Promise<string[]> {
    try {
      const { stdout } = await this.execGit(workspaceRoot, ['status', '--porcelain']);

      if (!stdout.trim()) {
        return [];
      }

      const files = new Set<string>();
      const lines = stdout
        .split('\n')
        .map((l: string) => l.trimEnd())
        .filter(Boolean);

      for (const line of lines) {
        // 形式: XY <path>  または  R  <old> -> <new>
        const payload = line.slice(3).trim();
        if (!payload) continue;

        let filePath = payload;
        const arrowIndex = payload.indexOf('->');
        if (arrowIndex >= 0) {
          filePath = payload.slice(arrowIndex + 2).trim();
        }

        files.add(path.join(workspaceRoot, filePath));
      }

      return Array.from(files);
    } catch (error) {
      this.outputChannel.appendLine(`[Git] Error getting working tree files: ${error}`);
      return [];
    }
  }

  /**
   * ファイルの変更統計を取得
   * @param workspaceRoot ワークスペースルート
   * @param filePath ファイルパス（相対パス）
   * @returns 変更統計
   */
  async getFileChangeStats(workspaceRoot: string, filePath: string): Promise<FileChangeStats> {
    try {
      // git log --follow --format=%ad --date=iso -- <filePath>
      const { stdout } = await this.execGit(
        workspaceRoot,
        ['log', '--follow', '--format=%ad', '--date=iso', '--', filePath],
        { maxBuffer: 1024 * 1024 * 10 }
      );

      if (!stdout.trim()) {
        // コミット履歴なし
        return {
          filePath,
          totalCommits: 0,
          commitsLast30Days: 0,
          commitsLast7Days: 0,
          lastCommitDate: null,
          changeFrequency: 0,
        };
      }

      const dates = stdout
        .trim()
        .split('\n')
        .map((line: string) => new Date(line.trim()));
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalCommits = dates.length;
      const commitsLast30Days = dates.filter((d: Date) => d >= thirtyDaysAgo).length;
      const commitsLast7Days = dates.filter((d: Date) => d >= sevenDaysAgo).length;
      const lastCommitDate = dates[0] || null;

      // 変更頻度を計算（0-1）
      // 重み: 30日以内 60%, 7日以内 40%
      const freq30 = totalCommits > 0 ? commitsLast30Days / totalCommits : 0;
      const freq7 = commitsLast30Days > 0 ? commitsLast7Days / commitsLast30Days : 0;
      const changeFrequency = Math.min(1.0, freq30 * 0.6 + freq7 * 0.4);

      return {
        filePath,
        totalCommits,
        commitsLast30Days,
        commitsLast7Days,
        lastCommitDate,
        changeFrequency,
      };
    } catch (error) {
      this.outputChannel.appendLine(
        `[Git] Error getting file change stats for ${filePath}: ${error}`
      );
      return {
        filePath,
        totalCommits: 0,
        commitsLast30Days: 0,
        commitsLast7Days: 0,
        lastCommitDate: null,
        changeFrequency: 0,
      };
    }
  }

  /**
   * 全ファイルの変更統計を一括取得（効率化版）
   * @param workspaceRoot ワークスペースルート
   * @returns ファイルパス → 変更統計のマップ
   */
  async getAllFileChangeStats(workspaceRoot: string): Promise<Map<string, FileChangeStats>> {
    const stats = new Map<string, FileChangeStats>();

    try {
      this.outputChannel.appendLine('[Git] Collecting file change statistics...');

      // git log --name-only --format="%ad|%H" --date=iso
      // 全コミット履歴を一度に取得
      const { stdout } = await this.execGit(
        workspaceRoot,
        ['log', '--name-only', '--format=%ad|%H', '--date=iso', '--all'],
        { maxBuffer: 1024 * 1024 * 50 }
      );

      if (!stdout.trim()) {
        this.outputChannel.appendLine('[Git] No commit history found');
        return stats;
      }

      const lines = stdout.trim().split('\n');
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // ファイルごとの集計
      const fileCounts = new Map<
        string,
        {
          total: number;
          last30: number;
          last7: number;
          lastDate: Date | null;
        }
      >();

      let currentDate: Date | null = null;

      for (const line of lines) {
        if (!line.trim()) continue;

        // 日付行（フォーマット: "2026-01-05 12:00:00 +0900|abc123"）
        if (line.includes('|')) {
          const dateStr = line.split('|')[0].trim();
          currentDate = new Date(dateStr);
          continue;
        }

        // ファイル名行
        const filePath = line.trim();
        if (!filePath || !currentDate) continue;

        // カウント初期化
        if (!fileCounts.has(filePath)) {
          fileCounts.set(filePath, {
            total: 0,
            last30: 0,
            last7: 0,
            lastDate: null,
          });
        }

        const count = fileCounts.get(filePath)!;
        count.total++;

        if (currentDate >= thirtyDaysAgo) {
          count.last30++;
        }
        if (currentDate >= sevenDaysAgo) {
          count.last7++;
        }

        if (!count.lastDate || currentDate > count.lastDate) {
          count.lastDate = currentDate;
        }
      }

      // 変更頻度を計算
      for (const [filePath, count] of fileCounts) {
        const freq30 = count.total > 0 ? count.last30 / count.total : 0;
        const freq7 = count.last30 > 0 ? count.last7 / count.last30 : 0;
        const changeFrequency = Math.min(1.0, freq30 * 0.6 + freq7 * 0.4);

        stats.set(filePath, {
          filePath,
          totalCommits: count.total,
          commitsLast30Days: count.last30,
          commitsLast7Days: count.last7,
          lastCommitDate: count.lastDate,
          changeFrequency,
        });
      }

      this.outputChannel.appendLine(`[Git] Collected stats for ${stats.size} files`);
    } catch (error) {
      this.outputChannel.appendLine(`[Git] Error getting all file change stats: ${error}`);
    }

    return stats;
  }
}
