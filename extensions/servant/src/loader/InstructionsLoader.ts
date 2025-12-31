import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import matter from 'gray-matter';

export interface Instruction {
  id: string;
  filePath: string;
  description: string;
  priority: string;
  rules: Rule[];
  applyTo?: string;
  enforceBeforeModification?: boolean;
}

export interface Rule {
  type: 'MUST' | 'MUST_NOT' | 'SHOULD' | 'CRITICAL' | 'WARNING' | 'INFO';
  pattern: string | RegExp;
  message: string;
  severity: 'error' | 'warning' | 'information' | 'hint';
}

export interface EntryPointInstruction extends Instruction {
  categories: string[];
}

export interface CategoryIndex extends Instruction {
  individualInstructions: string[];
}

export class InstructionsLoader {
  private entryPoint: EntryPointInstruction | null = null;
  private categoryIndices: Map<string, CategoryIndex> = new Map();
  private individualInstructions: Map<string, Instruction> = new Map();
  private workspaceRoot: string | null = null;

  constructor(private context: vscode.ExtensionContext) {}

  async load(): Promise<void> {
    // ワークスペースルート取得
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('No workspace folder found');
    }
    
    this.workspaceRoot = workspaceFolder.uri.fsPath;
    const instructionsRoot = path.join(this.workspaceRoot, '.aitk', 'instructions');
    
    // 1. Entry Point読み込み
    const indexPath = path.join(instructionsRoot, 'INDEX.md');
    if (await this.fileExists(indexPath)) {
      this.entryPoint = await this.parseEntryPoint(indexPath);
    }
    
    // 2. Category Index読み込み
    const categoriesDir = path.join(instructionsRoot, 'categories');
    if (await this.fileExists(categoriesDir)) {
      const categoryFiles = await fs.readdir(categoriesDir);
      for (const file of categoryFiles) {
        if (file.endsWith('.md')) {
          const categoryPath = path.join(categoriesDir, file);
          const category = await this.parseCategoryIndex(categoryPath);
          this.categoryIndices.set(category.id, category);
        }
      }
    }
    
    // 3. Individual Instructions読み込み
    const instructionFiles = await this.findInstructionFiles(instructionsRoot);
    for (const file of instructionFiles) {
      // categories/ とdecision-trees/ は除外
      if (!file.includes('/categories/') && !file.includes('/decision-trees/')) {
        const instruction = await this.parseInstruction(file);
        this.individualInstructions.set(instruction.id, instruction);
      }
    }
    
    console.log(`Loaded ${this.individualInstructions.size} instructions`);
  }

  async getApplicableInstructions(document: vscode.TextDocument): Promise<Instruction[]> {
    const applicable: Instruction[] = [];
    
    for (const instruction of this.individualInstructions.values()) {
      if (this.shouldApply(instruction, document)) {
        applicable.push(instruction);
      }
    }
    
    return applicable;
  }

  private shouldApply(instruction: Instruction, document: vscode.TextDocument): boolean {
    // applyToパターンに基づいて判定
    if (!instruction.applyTo) {
      return true; // すべてのファイルに適用
    }
    
    const relativePath = vscode.workspace.asRelativePath(document.uri);
    const pattern = new RegExp(instruction.applyTo.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    
    return pattern.test(relativePath);
  }

  private async parseEntryPoint(filePath: string): Promise<EntryPointInstruction> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: markdown } = matter(content);
    
    return {
      id: 'entry-point',
      filePath,
      description: data.description || '',
      priority: data.priority || 'entry-point',
      rules: this.extractRules(markdown),
      categories: this.extractCategories(markdown)
    };
  }

  private async parseCategoryIndex(filePath: string): Promise<CategoryIndex> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: markdown } = matter(content);
    
    const id = path.basename(filePath, '.md').toLowerCase();
    
    return {
      id,
      filePath,
      description: data.description || '',
      priority: data.priority || 'medium',
      rules: this.extractRules(markdown),
      individualInstructions: this.extractInstructionLinks(markdown)
    };
  }

  private async parseInstruction(filePath: string): Promise<Instruction> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: markdown } = matter(content);
    
    const id = path.basename(filePath, '.instructions.md');
    
    return {
      id,
      filePath,
      description: data.description || '',
      priority: data.priority || 'medium',
      rules: this.extractRules(markdown),
      applyTo: data.applyTo,
      enforceBeforeModification: data.enforceBeforeModification
    };
  }

  private extractRules(markdown: string): Rule[] {
    const rules: Rule[] = [];
    
    // MUST/MUST NOT/SHOULD/CRITICAL等の検出
    const mustPattern = /(?:^|\n)(?:[-*]|\d+\.)\s+\*\*(MUST|MUST NOT|SHOULD|CRITICAL|WARNING|INFO)\*\*[:\s]+(.+?)(?:\n|$)/gi;
    
    let match;
    while ((match = mustPattern.exec(markdown)) !== null) {
      const type = match[1].toUpperCase().replace(/\s+/g, '_') as Rule['type'];
      const message = match[2].trim();
      
      rules.push({
        type,
        pattern: '', // 後で拡張
        message,
        severity: this.getSeverityFromType(type)
      });
    }
    
    return rules;
  }

  private getSeverityFromType(type: Rule['type']): Rule['severity'] {
    switch (type) {
      case 'MUST':
      case 'MUST_NOT':
      case 'CRITICAL':
        return 'error';
      case 'WARNING':
      case 'SHOULD':
        return 'warning';
      case 'INFO':
        return 'information';
      default:
        return 'hint';
    }
  }

  private extractCategories(markdown: string): string[] {
    const categories: string[] = [];
    const categoryPattern = /\[Category:\s+(.+?)\]\(categories\/(.+?)\.md\)/gi;
    
    let match;
    while ((match = categoryPattern.exec(markdown)) !== null) {
      categories.push(match[2]);
    }
    
    return categories;
  }

  private extractInstructionLinks(markdown: string): string[] {
    const links: string[] = [];
    const linkPattern = /\[(.+?)\]\((.+?\.instructions\.md)\)/gi;
    
    let match;
    while ((match = linkPattern.exec(markdown)) !== null) {
      const instructionId = path.basename(match[2], '.instructions.md');
      links.push(instructionId);
    }
    
    return links;
  }

  private async findInstructionFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...await this.findInstructionFiles(fullPath));
        } else if (entry.name.endsWith('.instructions.md')) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      console.error(`Failed to read directory ${dir}:`, err);
    }
    
    return files;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Public API: Get all instructions
  getInstructions(): Instruction[] {
    return Array.from(this.individualInstructions.values());
  }

  // Public API: Get instruction by ID
  getInstruction(id: string): Instruction | undefined {
    return this.individualInstructions.get(id);
  }

  // Public API: Get all categories
  getCategories(): CategoryIndex[] {
    return Array.from(this.categoryIndices.values());
  }
}
