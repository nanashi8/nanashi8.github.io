import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export type ReadinessStatus = 'ok' | 'warn' | 'error';

export type ReadinessItem = {
  id: string;
  label: string;
  status: ReadinessStatus;
  points: number;
  detail?: string;
  ownerActions?: string[];
  commandIds?: string[];
};

export type WorkspaceReadinessReport = {
  generatedAt: string;
  workspaceRoot: string;
  isTrusted: boolean;
  score: number;
  maxScore: number;
  items: ReadinessItem[];
};

type EvalOptions = {
  contextPacketMaxAgeMinutes: number;
};

const safeStat = (absPath: string): fs.Stats | null => {
  try {
    return fs.statSync(absPath);
  } catch {
    return null;
  }
};

const existsFile = (absPath: string): boolean => {
  try {
    return fs.existsSync(absPath) && fs.statSync(absPath).isFile();
  } catch {
    return false;
  }
};

const existsDir = (absPath: string): boolean => {
  try {
    return fs.existsSync(absPath) && fs.statSync(absPath).isDirectory();
  } catch {
    return false;
  }
};

const readTextHead = (absPath: string, maxChars: number): string | null => {
  try {
    if (!existsFile(absPath)) return null;
    const content = fs.readFileSync(absPath, 'utf-8');
    return content.slice(0, maxChars);
  } catch {
    return null;
  }
};

const normalizeNewlines = (s: string) => s.replace(/\r\n/g, '\n');

const minutesSinceMtime = (stat: fs.Stats): number => (Date.now() - stat.mtimeMs) / 60000;

export class WorkspaceReadinessEvaluator {
  constructor(private readonly workspaceRoot: string) {}

  evaluate(options: EvalOptions): WorkspaceReadinessReport {
    const config = vscode.workspace.getConfiguration('servant');
    const isTrusted = vscode.workspace.isTrusted;
    const nowIso = new Date().toISOString();

    const items: ReadinessItem[] = [];

    // 1) Workspace trust
    items.push({
      id: 'workspace.trust',
      label: 'ワークスペースが信頼済み（Restricted Modeでない）',
      status: isTrusted ? 'ok' : 'error',
      points: 20,
      detail: isTrusted
        ? '信頼済み。拡張のフル機能が利用できます。'
        : '未信頼（Restricted Mode）。ファイルスキャン/自動生成などが制限されます。',
      ownerActions: isTrusted
        ? undefined
        : ['VS Code のワークスペース信頼（Trust）を有効化する'],
      commandIds: isTrusted ? undefined : ['workbench.action.manageWorkspaceTrust'],
    });

    // 2) package.json presence & scripts
    const pkgAbs = path.join(this.workspaceRoot, 'package.json');
    if (!existsFile(pkgAbs)) {
      items.push({
        id: 'node.packageJson',
        label: 'Nodeプロジェクト（package.json）が存在',
        status: 'warn',
        points: 10,
        detail: 'package.json が見つかりません。Node系の入口（npm scripts）が評価できません。',
      });
    } else {
      const pkgHead = readTextHead(pkgAbs, 20000);
      const hasPrepareHusky = pkgHead ? /"prepare"\s*:\s*"husky"/.test(pkgHead) : false;
      items.push({
        id: 'node.prepareHusky',
        label: 'Huskyがセットアップされる（package.json scripts.prepare=husky）',
        status: hasPrepareHusky ? 'ok' : 'warn',
        points: 10,
        detail: hasPrepareHusky
          ? 'npm install で Husky セットアップが走る想定です。'
          : 'prepare=husky が見当たりません（Git hooksの自動配線が弱くなる可能性）。',
        ownerActions: hasPrepareHusky ? undefined : ['package.json に scripts.prepare="husky" を追加する'],
      });
    }

    // 3) node_modules (practical readiness)
    const nodeModulesAbs = path.join(this.workspaceRoot, 'node_modules');
    const hasNodeModules = existsDir(nodeModulesAbs);
    items.push({
      id: 'node.nodeModules',
      label: '依存関係がインストール済み（node_modules が存在）',
      status: hasNodeModules ? 'ok' : 'warn',
      points: 10,
      detail: hasNodeModules
        ? '依存関係がインストール済みです。'
        : 'node_modules がありません。初回セットアップが未完了の可能性があります。',
      ownerActions: hasNodeModules ? undefined : ['プロジェクトルートで npm install を実行する'],
    });

    // 4) .husky directory & key hooks
    const huskyDir = path.join(this.workspaceRoot, '.husky');
    const hasHuskyDir = existsDir(huskyDir);
    items.push({
      id: 'git.huskyDir',
      label: '.husky ディレクトリが存在（フック定義）',
      status: hasHuskyDir ? 'ok' : 'warn',
      points: 10,
      detail: hasHuskyDir
        ? '.husky が存在します。'
        : '.husky が見つかりません。フックの入口が不明です。',
    });

    const huskyPreCommit = path.join(huskyDir, 'pre-commit');
    const huskyCommitMsg = path.join(huskyDir, 'commit-msg');
    const huskyPrePush = path.join(huskyDir, 'pre-push');
    const hookFiles = [
      { id: 'git.husky.preCommit', label: 'pre-commit が定義されている', abs: huskyPreCommit },
      { id: 'git.husky.commitMsg', label: 'commit-msg が定義されている', abs: huskyCommitMsg },
      { id: 'git.husky.prePush', label: 'pre-push が定義されている', abs: huskyPrePush },
    ];

    for (const h of hookFiles) {
      const ok = existsFile(h.abs);
      items.push({
        id: h.id,
        label: h.label,
        status: ok ? 'ok' : 'warn',
        points: 5,
        detail: ok ? vscode.workspace.asRelativePath(h.abs) : `未検出: ${vscode.workspace.asRelativePath(h.abs)}`,
      });
    }

    // 5) Husky installed into .git/hooks (runtime wiring)
    const gitHooksDir = path.join(this.workspaceRoot, '.git', 'hooks');
    const gitPreCommit = path.join(gitHooksDir, 'pre-commit');
    const gitCommitMsg = path.join(gitHooksDir, 'commit-msg');
    const gitPrePush = path.join(gitHooksDir, 'pre-push');
    const hookHead = (abs: string) => normalizeNewlines(readTextHead(abs, 4000) ?? '');
    const looksLikeHusky = (abs: string) => {
      const head = hookHead(abs);
      return head.includes('husky.sh') || head.includes('.husky');
    };

    const hasGitHooks = existsDir(gitHooksDir);
    if (!hasGitHooks) {
      items.push({
        id: 'git.gitHooksDir',
        label: '.git/hooks が存在（Gitフック実体）',
        status: 'warn',
        points: 5,
        detail: 'Gitリポジトリでないか、.git/hooks にアクセスできません。',
      });
    } else {
      const wiringChecks = [
        { id: 'git.wiring.preCommit', label: 'Git pre-commit が Husky に配線されている', abs: gitPreCommit },
        { id: 'git.wiring.commitMsg', label: 'Git commit-msg が Husky に配線されている', abs: gitCommitMsg },
        { id: 'git.wiring.prePush', label: 'Git pre-push が Husky に配線されている', abs: gitPrePush },
      ];

      for (const w of wiringChecks) {
        const ok = existsFile(w.abs) && looksLikeHusky(w.abs);
        items.push({
          id: w.id,
          label: w.label,
          status: ok ? 'ok' : 'warn',
          points: 5,
          detail: ok
            ? `OK: ${vscode.workspace.asRelativePath(w.abs)}`
            : `未配線の可能性: ${vscode.workspace.asRelativePath(w.abs)}`,
          ownerActions: ok
            ? undefined
            : ['プロジェクトルートで npm install を実行（prepare=husky により配線される想定）'],
        });
      }
    }

    // 6) AI instructions and context packet
    const aitkDir = path.join(this.workspaceRoot, '.aitk');
    const aitkInstructionsDir = path.join(aitkDir, 'instructions');
    const aitkContextAbs = path.join(aitkDir, 'context', 'AI_CONTEXT.md');

    items.push({
      id: 'aitk.dir',
      label: '.aitk ディレクトリが存在（AI用メタ情報）',
      status: existsDir(aitkDir) ? 'ok' : 'warn',
      points: 10,
      detail: existsDir(aitkDir) ? '.aitk が存在します。' : '.aitk が見つかりません。',
      ownerActions: existsDir(aitkDir) ? undefined : ['Servant導入手順に従い .aitk を用意する（または生成）'],
    });

    items.push({
      id: 'aitk.instructions',
      label: 'AI指示ファイルが存在（.aitk/instructions）',
      status: existsDir(aitkInstructionsDir) ? 'ok' : 'warn',
      points: 10,
      detail: existsDir(aitkInstructionsDir)
        ? vscode.workspace.asRelativePath(aitkInstructionsDir)
        : '指示ファイルが未整備です。',
      ownerActions: existsDir(aitkInstructionsDir) ? undefined : ['.aitk/instructions を整備する（最低限の指示書を置く）'],
    });

    // Context packet freshness
    const ctxStat = safeStat(aitkContextAbs);
    if (!ctxStat) {
      items.push({
        id: 'aitk.contextPacket',
        label: 'AI Context Packet が生成されている',
        status: 'warn',
        points: 10,
        detail: '未生成: .aitk/context/AI_CONTEXT.md',
        ownerActions: ['コマンド「Servant: Build AI Context Packet」を実行する'],
        commandIds: ['servant.context.build'],
      });
    } else {
      const ageMinutes = minutesSinceMtime(ctxStat);
      const fresh = ageMinutes <= options.contextPacketMaxAgeMinutes;
      items.push({
        id: 'aitk.contextPacketFreshness',
        label: `AI Context Packet が新しい（${options.contextPacketMaxAgeMinutes}分以内）`,
        status: fresh ? 'ok' : 'warn',
        points: 10,
        detail: `ageMinutes=${ageMinutes.toFixed(1)} / maxAgeMinutes=${options.contextPacketMaxAgeMinutes}`,
        ownerActions: fresh ? undefined : ['コマンド「Servant: Build AI Context Packet」を実行して更新する'],
        commandIds: fresh ? undefined : ['servant.context.build'],
      });
    }

    // 7) Project index existence
    const projectIndexAbs = path.join(this.workspaceRoot, '.vscode', 'project-index.json');
    const hasProjectIndex = existsFile(projectIndexAbs);
    items.push({
      id: 'servant.projectIndex',
      label: 'プロジェクトインデックスが存在（.vscode/project-index.json）',
      status: hasProjectIndex ? 'ok' : 'warn',
      points: 10,
      detail: hasProjectIndex
        ? vscode.workspace.asRelativePath(projectIndexAbs)
        : '未生成。関連ファイル探索の精度が下がります。',
      ownerActions: hasProjectIndex ? undefined : ['コマンド「Servant: Index Project for AI」を実行する'],
      commandIds: hasProjectIndex ? undefined : ['servant.indexProject'],
    });

    // Score computation
    const maxScore = items.reduce((sum, it) => sum + it.points, 0);
    const score = items.reduce((sum, it) => {
      if (it.status === 'ok') return sum + it.points;
      if (it.status === 'warn') return sum + Math.floor(it.points * 0.5);
      return sum;
    }, 0);

    return {
      generatedAt: nowIso,
      workspaceRoot: this.workspaceRoot,
      isTrusted,
      score,
      maxScore,
      items,
    };
  }

  toMarkdown(report: WorkspaceReadinessReport): string {
    const lines: string[] = [];
    lines.push('# WORKSPACE EVALUATION (Servant Readiness)');
    lines.push('');
    lines.push(`- generatedAt: ${report.generatedAt}`);
    lines.push(`- workspaceRoot: ${report.workspaceRoot}`);
    lines.push(`- trusted: ${report.isTrusted}`);
    lines.push(`- score: ${report.score}/${report.maxScore}`);
    lines.push('');

    const errors = report.items.filter((i) => i.status === 'error');
    const warns = report.items.filter((i) => i.status === 'warn');

    lines.push('## Summary');
    lines.push('');
    lines.push(`- errors: ${errors.length}`);
    lines.push(`- warnings: ${warns.length}`);
    lines.push('');

    lines.push('## Items');
    lines.push('');
    for (const it of report.items) {
      const statusEmoji = it.status === 'ok' ? '✅' : it.status === 'warn' ? '⚠️' : '🚨';
      lines.push(`### ${statusEmoji} ${it.label} (${it.status}, +${it.points})`);
      if (it.detail) {
        lines.push('');
        lines.push(it.detail);
      }
      if (it.ownerActions && it.ownerActions.length > 0) {
        lines.push('');
        lines.push('Owner actions:');
        for (const a of it.ownerActions) lines.push(`- ${a}`);
      }
      if (it.commandIds && it.commandIds.length > 0) {
        lines.push('');
        lines.push('VS Code commands:');
        for (const c of it.commandIds) lines.push(`- ${c}`);
      }
      lines.push('');
    }

    lines.push('## Notes');
    lines.push('');
    lines.push('- This report is generated locally (no external model).');
    lines.push('- It only inspects file existence and small headers (no secrets collection).');
    lines.push('');
    return lines.join('\n');
  }
}
