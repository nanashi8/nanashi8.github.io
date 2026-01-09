/**
 * Document Component System - Init Command
 *
 * 既存のdocs配下を解析して初期マッピングを生成
 */

import { readdirSync, statSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { minimatch } from 'minimatch';
import type { Component, ComponentType, DocPartConfig } from './core/types.js';
import { componentsToComponentMap, saveComponentMap } from './core/parser.js';
import { extractMarkdownLinks, extractFrontmatter, resolveRelativePath, normalizeMarkdownLink } from './core/markdown.js';
import { loadConfig } from './core/config.js';

/**
 * init コマンドの実行
 */
export async function initCommand(options: { configPath?: string; force?: boolean } = {}) {
  const config = loadConfig(options.configPath);
  const rootDir = config.rootDir;
  const outputPath = join(config.outputDir, '_components.yaml');

  console.log('🔍 Analyzing', rootDir, '...');

  // 既存ファイルのチェック
  if (existsSync(outputPath) && !options.force) {
    console.error(`❌ ${outputPath} already exists. Use --force to overwrite.`);
    process.exit(1);
  }

  // バックアップ
  if (existsSync(outputPath)) {
    const backupPath = `${outputPath}.backup-${Date.now()}`;
    writeFileSync(backupPath, readFileSync(outputPath));
    console.log(`📦 Backed up existing file to ${backupPath}`);
  }

  // Markdownファイルをスキャン
  const markdownFiles = scanMarkdownFiles(rootDir, config.exclude);
  console.log(`  Found ${markdownFiles.length} Markdown files`);

  // Component を生成
  const components: Component[] = [];
  let linkCount = 0;

  for (const filePath of markdownFiles) {
    const component = await analyzeMarkdownFile(filePath, rootDir, config);
    components.push(component);
    linkCount += component.requires.length;
  }

  // 型の分布を表示
  const typeCount = new Map<ComponentType, number>();
  for (const component of components) {
    typeCount.set(component.type, (typeCount.get(component.type) ?? 0) + 1);
  }

  console.log('  Detected file types:');
  for (const [type, count] of typeCount) {
    console.log(`    - ${type}: ${count}`);
  }

  console.log(`  Extracted ${linkCount} internal links`);

  // ComponentMap を生成
  const componentMap = componentsToComponentMap(components);
  componentMap.signals = config.signals;

  // 保存
  console.log('\n📝 Generating', outputPath, '...');
  saveComponentMap(outputPath, componentMap);

  console.log(`  Created ${components.length} components`);
  console.log(`  Inferred ${linkCount} requires relationships`);
  console.log('\n✅ Done:', outputPath);
}

/**
 * Markdownファイルをスキャン
 */
function scanMarkdownFiles(rootDir: string, exclude: string[]): string[] {
  const files: string[] = [];

  function scan(dir: string) {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relativePath = relative(process.cwd(), fullPath);

      // 除外パターンチェック
      if (exclude.some(pattern => minimatch(relativePath, pattern))) {
        continue;
      }

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (entry.endsWith('.md')) {
        files.push(relativePath);
      }
    }
  }

  scan(rootDir);
  return files;
}

/**
 * Markdownファイルを解析してComponentを生成
 */
async function analyzeMarkdownFile(
  filePath: string,
  rootDir: string,
  config: DocPartConfig
): Promise<Component> {
  // frontmatter をチェック
  const frontmatter = extractFrontmatter(filePath);

  if (frontmatter?.docpart) {
    // frontmatter に docpart が定義されている場合はそれを使う
    return {
      id: frontmatter.docpart.id,
      type: frontmatter.docpart.type,
      filePath,
      version: frontmatter.docpart.version,
      status: frontmatter.docpart.status,
      owners: frontmatter.docpart.owners,
      provides: frontmatter.docpart.provides ?? [],
      requires: frontmatter.docpart.requires ?? [],
    };
  }

  // 自動推論
  const id = inferComponentId(filePath, rootDir);
  const type = inferComponentType(filePath, config);
  const links = extractMarkdownLinks(filePath);

  const selfPortName = getPortNameFromPath(filePath);
  const selfSignal = inferSignalFromType(type);

  // リンクから requires を推論
  const requires = links
    .map(link => {
      const normalizedLink = normalizeMarkdownLink(link.href);

      // 非MarkdownへのリンクはDocPartの対象外（機能要件の“ドキュメント健全性”に集中）
      if (!normalizedLink.endsWith('.md')) {
        return null;
      }

      const targetPath = resolveRelativePath(filePath, normalizedLink);

      // docs外への参照はDocPartの対象外（.github/.aitk/scripts 等への参照ノイズを抑制）
      if (!(targetPath === rootDir || targetPath.startsWith(rootDir + '/'))) {
        return null;
      }

      return {
        name: getPortNameFromPath(targetPath),
        signal: selfSignal,
        from: inferComponentId(targetPath, rootDir),
        description: `Referenced from link: ${link.text}`,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .filter((req, index, self) => {
      // 重複を除去
      return self.findIndex(r => r.from === req.from && r.name === req.name) === index;
    });

  return {
    id,
    type,
    filePath,
    provides: [
      {
        name: selfPortName,
        signal: selfSignal,
        description: 'Self document',
      },
    ],
    requires,
  };
}

/**
 * ファイルパスから Component ID を推論
 */
function inferComponentId(filePath: string, rootDir: string): string {
  const relativePath = relative(rootDir, filePath);
  const withoutExt = relativePath.replace(/\.md$/, '');
  const parts = withoutExt.split('/');
  const normalized = parts.map(p => p.toUpperCase().replace(/[^A-Z0-9]/g, '_')).join(':');
  return `DOC:${normalized}`;
}

/**
 * ファイルパスから Component Type を推論
 */
function inferComponentType(filePath: string, config: DocPartConfig): ComponentType {
  const relativePath = relative(config.rootDir, filePath);

  // パターンマッチ
  for (const pattern of config.typeInference.patterns) {
    if (minimatch(relativePath, pattern.pattern)) {
      return pattern.type;
    }
  }

  // キーワードマッチ
  const filename = filePath.split('/').pop() ?? '';
  for (const keyword of config.typeInference.keywords) {
    if (filename.includes(keyword.keyword)) {
      return keyword.type;
    }
  }

  // デフォルトは guide
  return 'guide';
}

/**
 * ファイルパスからポート名を推論
 */
function getPortNameFromPath(filePath: string): string {
  const filename = filePath.split('/').pop() ?? '';
  const withoutExt = filename.replace(/\.md$/, '');
  return withoutExt.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * 型からSignalを推論
 */
function inferSignalFromType(type: ComponentType): string {
  const signalMap: Record<ComponentType, string> = {
    spec: 'Policy:v1',
    guide: 'Guide:v1',
    report: 'Report:v1',
    adr: 'Decision:v1',
    checklist: 'Checklist:v1',
  };

  return signalMap[type] ?? 'Guide:v1';
}
