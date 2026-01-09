/**
 * Document Component System - Dependency Analyzer
 *
 * 依存関係の解析とグラフ生成
 */

import type {
  Component,
  ComponentMap,
  DependencyGraph,
  GraphNode,
  GraphEdge,
  ValidationResult,
  ValidationWarning,
} from './types.js';
import { componentMapToComponents } from './parser.js';

/**
 * 依存関係グラフを生成
 */
export function buildDependencyGraph(componentMap: ComponentMap): DependencyGraph {
  const components = componentMapToComponents(componentMap);
  const componentById = new Map(components.map(c => [c.id, c]));

  // ノード生成
  const nodes: GraphNode[] = components.map(c => ({
    id: c.id,
    label: getDisplayName(c.filePath),
    type: c.type,
    filePath: c.filePath,
  }));

  // エッジ生成
  const edges: GraphEdge[] = [];

  for (const component of components) {
    for (const req of component.requires) {
      if (req.from) {
        const provider = componentById.get(req.from);
        if (provider) {
          edges.push({
            from: component.id,
            to: provider.id,
            portName: req.name,
            signal: req.signal,
            label: `${req.name}:${req.signal}`,
          });
        }
      } else {
        // from が未指定の場合、最初に見つかったプロバイダーに接続
        const provider = components.find(c =>
          c.provides.some(p => p.name === req.name && p.signal === req.signal)
        );

        if (provider) {
          edges.push({
            from: component.id,
            to: provider.id,
            portName: req.name,
            signal: req.signal,
            label: `${req.name}:${req.signal}`,
          });
        }
      }
    }
  }

  return { nodes, edges };
}

/**
 * 孤立部品を検出
 */
export function findOrphanedComponents(componentMap: ComponentMap): ValidationResult[] {
  const components = componentMapToComponents(componentMap);
  const referenced = new Set<string>();

  // requires で参照されている Component を集める
  for (const component of components) {
    for (const req of component.requires) {
      if (req.from) {
        referenced.add(req.from);
      } else {
        // from が未指定の場合、プロバイダーを探す
        const provider = components.find(c =>
          c.provides.some(p => p.name === req.name && p.signal === req.signal)
        );
        if (provider) {
          referenced.add(provider.id);
        }
      }
    }
  }

  const results: ValidationResult[] = [];

  for (const component of components) {
    // provides が空で、誰からも参照されていない
    if (component.provides.length === 0 && !referenced.has(component.id)) {
      const warnings: ValidationWarning[] = [
        {
          type: 'orphaned',
          message: 'This component is not referenced by any other component',
        },
      ];

      results.push({
        filePath: component.filePath,
        errors: [],
        warnings,
      });
    }
  }

  return results;
}

/**
 * 循環依存を検出
 */
export function detectCycles(componentMap: ComponentMap): ValidationResult[] {
  const graph = buildDependencyGraph(componentMap);
  const components = componentMapToComponents(componentMap);
  const componentById = new Map(components.map(c => [c.id, c]));

  const results: ValidationResult[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): string[] | null {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const outgoingEdges = graph.edges.filter(e => e.from === nodeId);

    for (const edge of outgoingEdges) {
      if (!visited.has(edge.to)) {
        const cycle = dfs(edge.to, [...path]);
        if (cycle) return cycle;
      } else if (recursionStack.has(edge.to)) {
        // 循環検出
        return [...path, edge.to];
      }
    }

    recursionStack.delete(nodeId);
    return null;
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      const cycle = dfs(node.id, []);
      if (cycle) {
        // 循環に含まれる全ての Component にwarningを追加
        for (const id of cycle) {
          const component = componentById.get(id);
          if (component) {
            results.push({
              filePath: component.filePath,
              errors: [],
              warnings: [
                {
                  type: 'weak-connection',
                  message: `Circular dependency detected: ${cycle.join(' → ')}`,
                },
              ],
            });
          }
        }
        break; // 最初の循環を検出したら終了
      }
    }
  }

  return results;
}

/**
 * ファイルパスから表示名を取得
 */
function getDisplayName(filePath: string): string {
  const parts = filePath.split('/');
  const filename = parts[parts.length - 1];
  return filename.replace(/\.md$/, '');
}

/**
 * Mermaid形式のグラフを生成
 */
export function generateMermaidGraph(
  graph: DependencyGraph,
  direction: 'TD' | 'LR' = 'TD',
  styles?: Record<string, string>
): string {
  const lines: string[] = [];

  lines.push(`graph ${direction}`);

  // ノード定義
  for (const node of graph.nodes) {
    const sanitizedId = node.id.replace(/[:\-.]/g, '_');
    const label = node.label.replace(/_/g, ' ');
    lines.push(`  ${sanitizedId}[${label}<br/>${node.type}]`);
  }

  lines.push('');

  // エッジ定義
  for (const edge of graph.edges) {
    const fromId = edge.from.replace(/[:\-.]/g, '_');
    const toId = edge.to.replace(/[:\-.]/g, '_');
    const label = edge.label.replace(/_/g, ' ');
    lines.push(`  ${fromId} -->|${label}| ${toId}`);
  }

  lines.push('');

  // スタイル定義
  if (styles) {
    for (const node of graph.nodes) {
      const sanitizedId = node.id.replace(/[:\-.]/g, '_');
      const style = styles[node.type];
      if (style) {
        lines.push(`  style ${sanitizedId} ${style}`);
      }
    }
  }

  return lines.join('\n');
}
