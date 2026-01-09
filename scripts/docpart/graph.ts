/**
 * Document Component System - Graph Command
 * 
 * 依存関係グラフの生成
 */

import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
import { loadComponentMap } from './core/parser.js';
import { buildDependencyGraph, generateMermaidGraph } from './core/analyzer.js';
import { loadConfig } from './core/config.js';

/**
 * graph コマンドの実行
 */
export async function graphCommand(options: { configPath?: string } = {}) {
  const config = loadConfig(options.configPath);
  const componentsPath = join(config.outputDir, '_components.yaml');

  if (!existsSync(componentsPath)) {
    console.error(`❌ ${componentsPath} not found. Run 'npm run docpart init' first.`);
    process.exit(1);
  }

  console.log('📊 Generating dependency graph ...\n');

  const componentMap = loadComponentMap(componentsPath);
  const graph = buildDependencyGraph(componentMap);

  // ノード数チェック
  if (graph.nodes.length > config.graph.maxNodes) {
    console.warn(
      `⚠️  Graph has ${graph.nodes.length} nodes (max: ${config.graph.maxNodes}). Output may be large.`
    );
  }

  // Mermaid形式で生成
  const mermaidContent = generateMermaidGraph(
    graph,
    config.graph.direction,
    config.graph.styles
  );

  const mermaidPath = join(config.outputDir, '_graph.mmd');
  writeFileSync(mermaidPath, mermaidContent, 'utf-8');
  console.log(`✅ Created: ${mermaidPath} (Mermaid)`);

  // JSON形式でも保存（機械可読）
  const jsonPath = join(config.outputDir, '_graph.json');
  writeFileSync(jsonPath, JSON.stringify(graph, null, 2), 'utf-8');
  console.log(`✅ Created: ${jsonPath} (JSON)`);

  // 統計情報
  console.log('\n' + '─'.repeat(50));
  console.log(`Nodes: ${graph.nodes.length}`);
  console.log(`Edges: ${graph.edges.length}`);

  const typeCount = new Map<string, number>();
  for (const node of graph.nodes) {
    typeCount.set(node.type, (typeCount.get(node.type) ?? 0) + 1);
  }

  console.log('\nNode types:');
  for (const [type, count] of typeCount) {
    console.log(`  - ${type}: ${count}`);
  }

  console.log('\n💡 Preview in VS Code:');
  console.log(`  1. Open ${mermaidPath}`);
  console.log(`  2. Use Mermaid Preview extension (bierner.markdown-mermaid)`);
  console.log(`  3. Or paste into https://mermaid.live/`);
}
