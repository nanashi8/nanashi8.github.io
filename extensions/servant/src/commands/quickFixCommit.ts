import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitIntegration } from '../git/GitIntegration';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * クイック修正コマンド：DECISIONS追記 → git add → git commit
 * ワンクリックでコミットまで完了
 */
export async function quickFixCommit(outputChannel: vscode.OutputChannel): Promise<void> {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('Workspace folder not found');
    return;
  }

  try {
    // ステップ1: 変更サマリを取得
    const gitIntegration = new GitIntegration(outputChannel);
    const stagedFiles = await gitIntegration.getStagedFiles(workspaceRoot);

    // unstaged変更も含める（git status --short）
    // NOTE: execAsyncは現在未使用だが、将来的にgit status取得に使用予定
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars
    const { exec } = require('child_process');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { promisify } = require('util');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _execAsync = promisify(exec);

    let unstagedFiles: string[] = [];
    try {
      const { stdout } = await execAsync('git status --short', { cwd: workspaceRoot });
      unstagedFiles = stdout
        .trim()
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => {
          // " M file.ts" → "file.ts"
          const match = line.match(/^\s*[MADRC?]\s+(.+)$/);
          return match ? match[1] : '';
        })
        .filter((f: string) => f);
    } catch {
      // ignore
    }

    const allFiles = [
      ...new Set([...stagedFiles.map((f) => path.relative(workspaceRoot, f)), ...unstagedFiles]),
    ];

    if (allFiles.length === 0) {
      vscode.window.showInformationMessage('変更がありません');
      return;
    }

    // ステップ2: 変更内容の入力を促す（簡単な説明）
    const description = await vscode.window.showInputBox({
      prompt: '変更内容を簡単に説明してください（例: lint エラー修正）',
      placeHolder: 'lint/Problems エラー全消し対応',
    });

    if (!description) {
      return; // キャンセル
    }

    // ステップ3: DECISIONS.md に追記
    const decisionsPath = path.join(workspaceRoot, 'docs/specifications/DECISIONS.md');
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const fileList = allFiles
      .slice(0, 10)
      .map((f) => `- ${f}`)
      .join('\n');
    const moreFiles = allFiles.length > 10 ? `\n- ... 他 ${allFiles.length - 10} ファイル` : '';

    const entry = `\n## ${dateStr}: ${description}\n\n### 変更内容\n${fileList}${moreFiles}\n\n### 理由\n${description}\n\n---\n`;

    if (fs.existsSync(decisionsPath)) {
      fs.appendFileSync(decisionsPath, entry, 'utf8');
    } else {
      fs.mkdirSync(path.dirname(decisionsPath), { recursive: true });
      fs.writeFileSync(decisionsPath, `# 決定ログ\n${entry}`, 'utf8');
    }

    outputChannel.appendLine(`[QuickFix] DECISIONS.md に追記しました`);

    // ステップ4: git add .
    await execAsync('git add .', { cwd: workspaceRoot });
    outputChannel.appendLine(`[QuickFix] git add 完了`);

    // ステップ5: git commit
    const commitMessage = `fix: ${description}`;
    await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
      cwd: workspaceRoot,
    });
    outputChannel.appendLine(`[QuickFix] git commit 完了: ${commitMessage}`);

    vscode.window.showInformationMessage(`✅ コミット完了: ${commitMessage}`);
  } catch (error: any) {
    outputChannel.appendLine(`[QuickFix] エラー: ${error?.message || error}`);
    vscode.window.showErrorMessage(`クイック修正失敗: ${error?.message || error}`);
  }
}
