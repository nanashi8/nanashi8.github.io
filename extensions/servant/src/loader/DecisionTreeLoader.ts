import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import matter from 'gray-matter';
import { MermaidParser, DecisionTree, DecisionPath } from '../parser/MermaidParser';

export interface DecisionTreeInstruction {
  id: string;
  filePath: string;
  description: string;
  tree: DecisionTree;
}

export class DecisionTreeLoader {
  private trees: Map<string, DecisionTreeInstruction> = new Map();
  private parser: MermaidParser;

  constructor(private workspaceRoot: string) {
    this.parser = new MermaidParser();
  }

  async load(): Promise<void> {
    const treesDir = path.join(this.workspaceRoot, '.aitk', 'instructions', 'decision-trees');
    
    try {
      const files = await fs.readdir(treesDir);
      
      for (const file of files) {
        if (file.endsWith('.instructions.md')) {
          const filePath = path.join(treesDir, file);
          const treeInstruction = await this.parseDecisionTree(filePath);
          
          if (treeInstruction) {
            this.trees.set(treeInstruction.id, treeInstruction);
          }
        }
      }
      
      console.log(`Loaded ${this.trees.size} decision trees`);
    } catch (err) {
      console.error('Failed to load decision trees:', err);
    }
  }

  private async parseDecisionTree(filePath: string): Promise<DecisionTreeInstruction | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { data, content: markdown } = matter(content);
      
      const id = path.basename(filePath, '.instructions.md');
      
      // Mermaidコードブロックを抽出
      const mermaidMatch = markdown.match(/```mermaid\n([\s\S]+?)\n```/);
      
      if (!mermaidMatch) {
        console.warn(`No mermaid diagram found in ${filePath}`);
        return null;
      }
      
      const mermaidCode = mermaidMatch[1];
      const tree = this.parser.parse(mermaidCode);
      
      return {
        id,
        filePath,
        description: data.description || '',
        tree
      };
    } catch (err) {
      console.error(`Failed to parse decision tree ${filePath}:`, err);
      return null;
    }
  }

  getTree(id: string): DecisionTreeInstruction | undefined {
    return this.trees.get(id);
  }

  getAllTrees(): DecisionTreeInstruction[] {
    return Array.from(this.trees.values());
  }

  /**
   * ファイルコンテキストに基づいて適用可能なDecision Treesを取得
   */
  getApplicableTrees(document: vscode.TextDocument): DecisionTreeInstruction[] {
    const applicable: DecisionTreeInstruction[] = [];
    const fileName = path.basename(document.fileName).toLowerCase();
    
    for (const tree of this.trees.values()) {
      // ファイル名に基づく適用判定
      if (tree.id.includes('bug-fix') && (fileName.includes('fix') || fileName.includes('bug'))) {
        applicable.push(tree);
      }
      
      if (tree.id.includes('feature') && fileName.includes('feature')) {
        applicable.push(tree);
      }
      
      if (tree.id.includes('refactoring') && fileName.includes('refactor')) {
        applicable.push(tree);
      }
      
      if (tree.id.includes('performance') && fileName.includes('performance')) {
        applicable.push(tree);
      }
    }
    
    return applicable;
  }

  /**
   * Decision Treeを辿って推奨事項を取得
   */
  evaluateTree(
    tree: DecisionTree,
    context: Record<string, any>
  ): DecisionPath {
    return this.parser.traverse(tree, context);
  }
}
