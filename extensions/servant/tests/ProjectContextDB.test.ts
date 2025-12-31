import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';
import { ProjectContextDB } from '../src/context/ProjectContextDB';

describe('ProjectContextDB', () => {
  let db: ProjectContextDB;
  let testWorkspaceRoot: string;

  beforeEach(() => {
    testWorkspaceRoot = path.join(__dirname, '..');
    db = new ProjectContextDB(testWorkspaceRoot);
  });

  it('インスタンスを作成できる', () => {
    expect(db).toBeDefined();
    expect(typeof db.getStats).toBe('function');
    expect(typeof db.getContextForFile).toBe('function');
    expect(typeof db.collectContextForAI).toBe('function');
  });

  it('統計情報のインターフェースが正しい', () => {
    const stats = db.getStats();

    // indexProject未実行でもnullを返す
    if (stats) {
      expect(stats).toHaveProperty('totalFiles');
      expect(stats).toHaveProperty('totalDependencies');
      expect(stats).toHaveProperty('avgImports');
      expect(stats).toHaveProperty('lastIndexed');
    }
  });

  it('AI向けコンテキストを生成できる', async () => {
    const aiContext = await db.collectContextForAI('test task');

    expect(aiContext).toHaveProperty('task');
    expect(aiContext).toHaveProperty('relevantFiles');
    expect(aiContext).toHaveProperty('suggestedActions');
    expect(aiContext).toHaveProperty('warnings');
    expect(aiContext).toHaveProperty('examples');
    expect(aiContext).toHaveProperty('instructions');

    expect(Array.isArray(aiContext.relevantFiles)).toBe(true);
    expect(Array.isArray(aiContext.suggestedActions)).toBe(true);
  });
});
