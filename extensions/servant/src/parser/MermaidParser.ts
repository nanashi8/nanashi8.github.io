/**
 * Decision Tree Parser
 * Mermaid図（flowchart/graph）を解析して条件分岐ツリーに変換
 */

export interface DecisionNode {
  id: string;
  label: string;
  type: 'start' | 'decision' | 'action' | 'end';
  children: DecisionEdge[];
}

export interface DecisionEdge {
  condition?: string;
  targetId: string;
}

export interface DecisionTree {
  id: string;
  nodes: Map<string, DecisionNode>;
  rootId: string;
}

export class MermaidParser {
  /**
   * Mermaid図のflowchart/graphをパース
   */
  parse(mermaidCode: string): DecisionTree {
    const lines = mermaidCode
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('%%')); // コメント除外
    
    const nodes = new Map<string, DecisionNode>();
    let rootId = '';
    
    // graphタイプを検出
    const graphType = this.detectGraphType(lines[0]);
    if (!graphType) {
      throw new Error('Not a valid Mermaid flowchart');
    }
    
    // ノードとエッジを解析
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // エッジ定義を先に処理: A[Label] --> B[Label2] or A -->|Yes| B
      const edgeMatch = line.match(/(\w+)([\[\{\(].+?[\]\}\)])?\s*-->\s*(?:\|(.+?)\|)?\s*(\w+)([\[\{\(].+?[\]\}\)])?/);
      if (edgeMatch) {
        const [, fromId, fromDef, condition, toId, toDef] = edgeMatch;
        
        // fromノードの処理
        if (fromDef) {
          const fromNodeMatch = fromDef.match(/([\[\{\(])(.+?)([\]\}\)])/);
          if (fromNodeMatch) {
            const [, openBracket, label] = fromNodeMatch;
            const type = this.getNodeType(openBracket);
            
            if (nodes.has(fromId)) {
              const existingNode = nodes.get(fromId)!;
              existingNode.label = label;
              existingNode.type = type;
            } else {
              nodes.set(fromId, {
                id: fromId,
                label,
                type,
                children: []
              });
            }
          }
        } else if (!nodes.has(fromId)) {
          nodes.set(fromId, {
            id: fromId,
            label: fromId,
            type: 'action',
            children: []
          });
        }
        
        // toノードの処理
        if (toDef) {
          const toNodeMatch = toDef.match(/([\[\{\(])(.+?)([\]\}\)])/);
          if (toNodeMatch) {
            const [, openBracket, label] = toNodeMatch;
            const type = this.getNodeType(openBracket);
            
            if (nodes.has(toId)) {
              const existingNode = nodes.get(toId)!;
              existingNode.label = label;
              existingNode.type = type;
            } else {
              nodes.set(toId, {
                id: toId,
                label,
                type,
                children: []
              });
            }
          }
        } else if (!nodes.has(toId)) {
          nodes.set(toId, {
            id: toId,
            label: toId,
            type: 'action',
            children: []
          });
        }
        
        // エッジ追加
        const fromNode = nodes.get(fromId)!;
        fromNode.children.push({
          condition: condition?.trim(),
          targetId: toId
        });
        
        // 最初のノードをrootとする
        if (!rootId && i === 1) {
          rootId = fromId;
        }
        
        continue;
      }
      
      // スタンドアローンのノード定義: A[Label] or A{Question?}
      const nodeMatch = line.match(/^(\w+)([\[\{\(])(.+?)([\]\}\)])\s*$/);
      if (nodeMatch) {
        const [, id, openBracket, label] = nodeMatch;
        const type = this.getNodeType(openBracket);
        
        // 既存ノードを更新または新規作成
        if (nodes.has(id)) {
          const existingNode = nodes.get(id)!;
          existingNode.label = label;
          existingNode.type = type;
        } else {
          nodes.set(id, {
            id,
            label,
            type,
            children: []
          });
        }
        
        // 最初のノードをrootとする
        if (!rootId && i === 1) {
          rootId = id;
        }
      }
    }
    
    return {
      id: 'decision-tree',
      nodes,
      rootId: rootId || nodes.keys().next().value || ''
    };
  }
  
  private detectGraphType(firstLine: string): string | null {
    const match = firstLine.match(/^(graph|flowchart)\s+(TD|LR|TB|RL|BT)/);
    return match ? match[1] : null;
  }
  
  private getNodeType(bracket: string): DecisionNode['type'] {
    switch (bracket) {
      case '[': return 'action';      // [Label]
      case '{': return 'decision';    // {Question?}
      case '(': return 'start';       // (Start)
      default: return 'action';
    }
  }
  
  /**
   * Decision Treeを辿って条件評価
   */
  traverse(
    tree: DecisionTree,
    context: Record<string, any>
  ): DecisionPath {
    const path: string[] = [];
    const recommendations: string[] = [];
    
    let currentId = tree.rootId;
    const visited = new Set<string>();
    
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      
      const node = tree.nodes.get(currentId);
      if (!node) break;
      
      path.push(node.id);
      
      // Decisionノードの場合、条件評価
      if (node.type === 'decision') {
        const nextEdge = this.evaluateDecision(node, context);
        if (nextEdge) {
          recommendations.push(`${node.label} → ${nextEdge.condition || 'default'}`);
          currentId = nextEdge.targetId;
        } else {
          break;
        }
      } else if (node.type === 'action') {
        recommendations.push(node.label);
        
        // 次のノードへ
        if (node.children.length > 0) {
          currentId = node.children[0].targetId;
        } else {
          break;
        }
      } else {
        break;
      }
      
      // 無限ループ防止
      if (path.length > 50) {
        break;
      }
    }
    
    return {
      path,
      recommendations,
      finalNodeId: currentId
    };
  }
  
  private evaluateDecision(
    node: DecisionNode,
    context: Record<string, any>
  ): DecisionEdge | null {
    // 各条件を評価（簡易版）
    for (const edge of node.children) {
      if (!edge.condition) {
        return edge; // 条件なし = デフォルトルート
      }
      
      // 条件マッチング（簡易版）
      if (this.matchCondition(edge.condition, context)) {
        return edge;
      }
    }
    
    // デフォルト: 最初のエッジ
    return node.children[0] || null;
  }
  
  private matchCondition(
    condition: string,
    context: Record<string, any>
  ): boolean {
    const lowerCondition = condition.toLowerCase();
    
    // Yes/No判定
    if (lowerCondition.includes('yes') || lowerCondition.includes('はい')) {
      return context.answer === true;
    }
    if (lowerCondition.includes('no') || lowerCondition.includes('いいえ')) {
      return context.answer === false;
    }
    
    // 型エラー判定
    if (lowerCondition.includes('型エラー') || lowerCondition.includes('type error')) {
      return context.errorType === 'type';
    }
    
    // ロジックエラー判定
    if (lowerCondition.includes('ロジック') || lowerCondition.includes('logic')) {
      return context.errorType === 'logic';
    }
    
    // UI問題判定
    if (lowerCondition.includes('ui') || lowerCondition.includes('画面')) {
      return context.errorType === 'ui';
    }
    
    // データ問題判定
    if (lowerCondition.includes('データ') || lowerCondition.includes('data')) {
      return context.errorType === 'data';
    }
    
    return false;
  }
}

export interface DecisionPath {
  path: string[];
  recommendations: string[];
  finalNodeId: string;
}
