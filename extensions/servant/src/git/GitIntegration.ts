import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
      const { stdout, stderr } = await execAsync('git rev-parse --git-dir', {
        cwd: workspaceRoot
      });

      if (stderr) {
        this.outputChannel.appendLine(`[Git] Error checking repository: ${stderr}`);
        return false;
      }

      return stdout.trim().length > 0;
    } catch (error) {
      this.outputChannel.appendLine(`[Git] Not a git repository: ${error}`);
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
      const { stdout } = await execAsync('git rev-parse --git-dir', {
        cwd: workspaceRoot
      });

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
      // git diff --cached --name-only でstaged filesを取得
      const { stdout } = await execAsync('git diff --cached --name-only', {
        cwd: workspaceRoot
      });

      if (!stdout.trim()) {
        this.outputChannel.appendLine('[Git] No staged files found');
        return [];
      }

      // 相対パスを絶対パスに変換
      const relativePaths = stdout.trim().split('\n').filter(p => p.length > 0);
      const absolutePaths = relativePaths.map(p => path.join(workspaceRoot, p));

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
    return files.filter(file => file.endsWith('.instructions.md'));
  }

  /**
   * Gitのルートディレクトリを取得
   *
   * @param workspaceRoot - ワークスペースのルートパス
   * @returns Gitルートディレクトリの絶対パス
   */
  async getGitRoot(workspaceRoot: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync('git rev-parse --show-toplevel', {
        cwd: workspaceRoot
      });

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
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: workspaceRoot
      });

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
      await execAsync(`git add "${relativePath}"`, {
        cwd: workspaceRoot
      });

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
      const { stdout } = await execAsync('git status --porcelain', {
        cwd: workspaceRoot
      });

      if (!stdout.trim()) {
        return [];
      }

      const files = new Set<string>();
      const lines = stdout.split('\n').map(l => l.trimEnd()).filter(Boolean);

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
}
