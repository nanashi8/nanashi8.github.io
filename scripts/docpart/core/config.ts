/**
 * Document Component System - Configuration Loader
 * 
 * .docpartrc.yaml の読み込み
 */

import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';
import { resolve } from 'path';
import type { DocPartConfig, SignalDefinition } from './types.js';

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG: DocPartConfig = {
  version: '1.0',
  rootDir: 'docs',
  outputDir: 'docs',
  signals: [
    { name: 'Policy:v1', description: '方針・ルール・基準' },
    { name: 'Schema:v1', description: 'データ構造・API定義' },
    { name: 'Scope:v1', description: 'スコープ・範囲・責務' },
    { name: 'Decision:v1', description: '意思決定・ADR' },
    { name: 'Checklist:v1', description: '手順・チェックリスト' },
    { name: 'Guide:v1', description: 'ガイド・説明・チュートリアル' },
    { name: 'Report:v1', description: '実績レポート・分析結果' },
  ],
  typeInference: {
    patterns: [
      { pattern: 'design/*.md', type: 'spec' },
      { pattern: 'specifications/*.md', type: 'spec' },
      { pattern: 'how-to/*.md', type: 'guide' },
      { pattern: 'reports/*.md', type: 'report' },
      { pattern: 'adr/*.md', type: 'adr' },
      { pattern: '**/ADR_*.md', type: 'adr' },
      { pattern: '**/CHECKLIST_*.md', type: 'checklist' },
    ],
    keywords: [
      { keyword: 'GUIDE', type: 'guide' },
      { keyword: 'REPORT', type: 'report' },
      { keyword: 'SPEC', type: 'spec' },
    ],
  },
  exclude: [
    'node_modules/**',
    'dist/**',
    'coverage/**',
    '.git/**',
    'archive/**',
    'drafts/**',
  ],
  lint: {
    unresolvedAsWarning: true,
    detectOrphans: true,
    detectCycles: true,
  },
  graph: {
    direction: 'TD',
    maxNodes: 100,
    styles: {
      spec: 'fill:#e1f5ff,stroke:#0066cc',
      guide: 'fill:#fff4e1,stroke:#cc8800',
      report: 'fill:#e8f5e9,stroke:#2e7d32',
      adr: 'fill:#f3e5f5,stroke:#7b1fa2',
      checklist: 'fill:#fff3e0,stroke:#e65100',
    },
  },
};

/**
 * .docpartrc.yaml を読み込む
 */
export function loadConfig(configPath?: string): DocPartConfig {
  const paths = [
    configPath,
    '.docpartrc.yaml',
    '.docpartrc.yml',
    'nanashi8.github.io/.docpartrc.yaml',
  ].filter(Boolean) as string[];

  for (const path of paths) {
    const fullPath = resolve(path);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        const config = parse(content) as Partial<DocPartConfig>;
        return mergeConfig(DEFAULT_CONFIG, config);
      } catch (error) {
        console.warn(`Failed to load config from ${fullPath}:`, error);
      }
    }
  }

  console.log('Using default configuration');
  return DEFAULT_CONFIG;
}

/**
 * 設定をマージ
 */
function mergeConfig(
  defaultConfig: DocPartConfig,
  userConfig: Partial<DocPartConfig>
): DocPartConfig {
  return {
    ...defaultConfig,
    ...userConfig,
    signals: userConfig.signals ?? defaultConfig.signals,
    typeInference: {
      ...defaultConfig.typeInference,
      ...userConfig.typeInference,
    },
    lint: {
      ...defaultConfig.lint,
      ...userConfig.lint,
    },
    graph: {
      ...defaultConfig.graph,
      ...userConfig.graph,
    },
  };
}
