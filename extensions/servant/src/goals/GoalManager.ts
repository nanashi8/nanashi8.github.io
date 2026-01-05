import * as fs from 'fs';
import * as path from 'path';

/**
 * プロジェクトのゴール定義
 */
export interface Goal {
  /** ゴールID */
  id: string;
  /** ゴール名 */
  name: string;
  /** 説明 */
  description: string;
  /** 優先度（0-1、1が最高） */
  priority: number;
  /** 作成日時 */
  createdAt: string;
  /** キーワード */
  keywords: string[];
  /** コアファイル（ゴールに最も近いファイル） */
  coreFiles: string[];
}

/**
 * プロジェクトゴール全体
 */
export interface ProjectGoals {
  version: number;
  createdAt: string;
  updatedAt: string;
  goals: Goal[];
}

/**
 * ゴール管理クラス
 */
export class GoalManager {
  private workspaceRoot: string;
  private goalsPath: string;
  private goals: ProjectGoals | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.goalsPath = path.join(workspaceRoot, '.vscode', 'project-goals.json');
  }

  /**
   * ゴール定義を読み込む
   */
  public loadGoals(): ProjectGoals {
    if (this.goals) {
      return this.goals;
    }

    try {
      if (fs.existsSync(this.goalsPath)) {
        const content = fs.readFileSync(this.goalsPath, 'utf-8');
        this.goals = JSON.parse(content);
        return this.goals!;
      }
    } catch (error) {
      console.error('Failed to load project goals:', error);
    }

    // デフォルトゴール（ファイルが存在しない場合）
    this.goals = {
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      goals: [
        {
          id: 'main-goal',
          name: 'プロジェクトの目標',
          description: 'プロジェクトのゴールを .vscode/project-goals.json で定義してください',
          priority: 1.0,
          createdAt: new Date().toISOString(),
          keywords: [],
          coreFiles: []
        }
      ]
    };

    return this.goals;
  }

  /**
   * メインゴールを取得（最も優先度が高いゴール）
   */
  public getMainGoal(): Goal {
    const goals = this.loadGoals();
    const sorted = [...goals.goals].sort((a, b) => b.priority - a.priority);
    return sorted[0];
  }

  /**
   * 全ゴールを取得
   */
  public getAllGoals(): Goal[] {
    return this.loadGoals().goals;
  }

  /**
   * ファイルとゴールの距離を計算
   * @param filePath ファイルパス（相対パス）
   * @returns 距離（0=中心、1=遠い）
   */
  public calculateGoalDistance(filePath: string): number {
    const goals = this.loadGoals();

    // 各ゴールとの距離を計算し、最小値を返す
    let minDistance = 1.0;

    for (const goal of goals.goals) {
      const distance = this.calculateDistanceToGoal(filePath, goal);
      const weightedDistance = distance * (2.0 - goal.priority); // 優先度が高いほど重視
      minDistance = Math.min(minDistance, weightedDistance);
    }

    return Math.max(0, Math.min(1, minDistance));
  }

  /**
   * 特定のゴールとの距離を計算
   */
  private calculateDistanceToGoal(filePath: string, goal: Goal): number {
    // 正規化（相対パス化）
    const normalizedPath = this.normalizePath(filePath);

    // 1. コアファイルに含まれている場合 → 距離 0
    for (const coreFile of goal.coreFiles) {
      const normalizedCore = this.normalizePath(coreFile);
      if (normalizedPath === normalizedCore) {
        return 0.0;
      }
    }

    // 2. コアファイルと同じディレクトリ → 距離 0.2
    for (const coreFile of goal.coreFiles) {
      const coreDir = path.dirname(this.normalizePath(coreFile));
      const fileDir = path.dirname(normalizedPath);
      if (coreDir === fileDir) {
        return 0.2;
      }
    }

    // 3. キーワードマッチング（ファイル名・パス）
    const fileContent = normalizedPath.toLowerCase();
    let keywordMatchScore = 0;

    for (const keyword of goal.keywords) {
      if (fileContent.includes(keyword.toLowerCase())) {
        keywordMatchScore += 0.2;
      }
    }

    if (keywordMatchScore > 0) {
      return Math.max(0.3, 1.0 - keywordMatchScore);
    }

    // 4. パス類似度（共通の親ディレクトリ数）
    let minPathDistance = 1.0;
    for (const coreFile of goal.coreFiles) {
      const distance = this.calculatePathDistance(normalizedPath, this.normalizePath(coreFile));
      minPathDistance = Math.min(minPathDistance, distance);
    }

    return minPathDistance;
  }

  /**
   * パス間の距離を計算（共通の親ディレクトリ数に基づく）
   */
  private calculatePathDistance(path1: string, path2: string): number {
    const parts1 = path1.split('/').filter(p => p.length > 0);
    const parts2 = path2.split('/').filter(p => p.length > 0);

    // 共通プレフィックスの長さ
    let commonLength = 0;
    const minLength = Math.min(parts1.length, parts2.length);

    for (let i = 0; i < minLength; i++) {
      if (parts1[i] === parts2[i]) {
        commonLength++;
      } else {
        break;
      }
    }

    // 距離 = 1 - (共通の深さ / 最大の深さ)
    const maxDepth = Math.max(parts1.length, parts2.length);
    if (maxDepth === 0) return 1.0;

    const distance = 1.0 - (commonLength / maxDepth);

    // 最小距離 0.4（完全に無関係なファイルでも少しは関連がある）
    return Math.max(0.4, Math.min(1.0, distance));
  }

  /**
   * パスを正規化（相対パス化、区切り文字統一）
   */
  private normalizePath(filePath: string): string {
    // 絶対パスの場合、ワークスペースルートからの相対パスに変換
    let normalized = filePath;

    if (path.isAbsolute(filePath)) {
      normalized = path.relative(this.workspaceRoot, filePath);
    }

    // 区切り文字を統一（Windowsの \ を / に）
    normalized = normalized.replace(/\\/g, '/');

    // 先頭の ./ を削除
    if (normalized.startsWith('./')) {
      normalized = normalized.substring(2);
    }

    return normalized;
  }

  /**
   * ファイルがどのゴールに最も近いかを判定
   */
  public findClosestGoal(filePath: string): { goal: Goal; distance: number } {
    const goals = this.loadGoals();

    let closestGoal = goals.goals[0];
    let minDistance = this.calculateDistanceToGoal(filePath, closestGoal);

    for (const goal of goals.goals) {
      const distance = this.calculateDistanceToGoal(filePath, goal);
      if (distance < minDistance) {
        minDistance = distance;
        closestGoal = goal;
      }
    }

    return { goal: closestGoal, distance: minDistance };
  }

  /**
   * ゴール定義を保存
   */
  public saveGoals(goals: ProjectGoals): void {
    try {
      const dir = path.dirname(this.goalsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      goals.updatedAt = new Date().toISOString();
      fs.writeFileSync(this.goalsPath, JSON.stringify(goals, null, 2), 'utf-8');
      this.goals = goals;
    } catch (error) {
      console.error('Failed to save project goals:', error);
      throw error;
    }
  }

  /**
   * ゴールを追加
   */
  public addGoal(goal: Omit<Goal, 'createdAt'>): void {
    const goals = this.loadGoals();
    const newGoal: Goal = {
      ...goal,
      createdAt: new Date().toISOString()
    };
    goals.goals.push(newGoal);
    this.saveGoals(goals);
  }

  /**
   * ゴールを更新
   */
  public updateGoal(goalId: string, updates: Partial<Goal>): void {
    const goals = this.loadGoals();
    const goalIndex = goals.goals.findIndex(g => g.id === goalId);

    if (goalIndex === -1) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    goals.goals[goalIndex] = {
      ...goals.goals[goalIndex],
      ...updates
    };

    this.saveGoals(goals);
  }

  /**
   * ゴールを削除
   */
  public deleteGoal(goalId: string): void {
    const goals = this.loadGoals();
    goals.goals = goals.goals.filter(g => g.id !== goalId);
    this.saveGoals(goals);
  }
}
