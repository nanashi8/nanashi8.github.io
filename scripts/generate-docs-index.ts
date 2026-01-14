/**
 * docs/INDEX.md 自動生成スクリプト
 *
 * 機能:
 * - docs/ 配下を再帰的にスキャン
 * - Front Matter からメタデータを抽出
 * - ディレクトリごとにファイル数を集計
 * - 参照数の多いファイルを自動検出
 * - INDEX.md を自動更新
 *
 * 実行方法:
 *   npm run generate-index
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.resolve(__dirname, '../docs');
const REPO_ROOT = path.resolve(DOCS_DIR, '..');
const INDEX_FILE = path.join(DOCS_DIR, 'INDEX.md');

interface DocFile {
  path: string;
  relativePath: string;
  title: string;
  status?: string;
  tags?: string[];
  created?: string;
  updated?: string;
}

interface DirectoryStats {
  name: string;
  count: number;
  files: DocFile[];
}

interface FileReference {
  file: string;
  count: number;
}

/**
 * docs/ 配下の Markdown ファイルをすべてスキャン
 */
function scanDocsDirectory(): DocFile[] {
  const files: DocFile[] = [];

  function scan(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // private/ は除外
        if (entry.name !== 'private') {
          scan(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const relativePath = path.relative(DOCS_DIR, fullPath);
        const content = fs.readFileSync(fullPath, 'utf-8');

        try {
          const { data } = matter(content);
          files.push({
            path: fullPath,
            relativePath,
            title: data.title || entry.name.replace('.md', ''),
            status: data.status,
            tags: data.tags,
            created: data.created,
            updated: data.updated,
          });
        } catch (error) {
          // Front Matter がないファイルはタイトルだけ取得
          files.push({
            path: fullPath,
            relativePath,
            title: entry.name.replace('.md', ''),
          });
        }
      }
    }
  }

  scan(DOCS_DIR);
  return files;
}

/**
 * ディレクトリごとのファイル数を集計
 */
function aggregateByDirectory(files: DocFile[]): DirectoryStats[] {
  const dirMap = new Map<string, DocFile[]>();

  for (const file of files) {
    const dir = path.dirname(file.relativePath);
    const topDir = dir.split(path.sep)[0] || '.';

    if (!dirMap.has(topDir)) {
      dirMap.set(topDir, []);
    }
    dirMap.get(topDir)!.push(file);
  }

  const stats: DirectoryStats[] = [];
  for (const [name, dirFiles] of dirMap.entries()) {
    stats.push({
      name,
      count: dirFiles.length,
      files: dirFiles,
    });
  }

  return stats.sort((a, b) => b.count - a.count);
}

/**
 * ファイルの参照数を集計（他のドキュメントから何回リンクされているか）
 */
function countReferences(files: DocFile[]): FileReference[] {
  const refMap = new Map<string, number>();

  const toPosixPath = (p: string): string => p.split(path.sep).join('/');

  const normalizeLinkedDocPath = (sourceFileAbsPath: string, linkedPathRaw: string): string | null => {
    const linkedPath = linkedPathRaw.trim();

    // Ignore obvious non-file links
    if (!linkedPath || linkedPath.startsWith('#')) return null;

    let targetAbsPath: string;

    // Repo-root absolute links (e.g. /docs/..., /.github/...)
    if (linkedPath.startsWith('/')) {
      targetAbsPath = path.resolve(REPO_ROOT, `.${linkedPath}`);
    } else {
      // Relative to the source markdown file
      targetAbsPath = path.resolve(path.dirname(sourceFileAbsPath), linkedPath);
    }

    // Only count references to existing docs/*.md
    const docsPrefix = `${DOCS_DIR}${path.sep}`;
    if (!(targetAbsPath + path.sep).startsWith(docsPrefix)) return null;
    if (!targetAbsPath.endsWith('.md')) return null;
    if (!fs.existsSync(targetAbsPath)) return null;
    const stat = fs.statSync(targetAbsPath);
    if (!stat.isFile()) return null;

    return toPosixPath(path.relative(DOCS_DIR, targetAbsPath));
  };

  for (const file of files) {
    const content = fs.readFileSync(file.path, 'utf-8');

    // Markdown リンクを抽出（簡易版）
    const linkRegex = /\[.*?\]\((.*?\.md)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkedFileRaw = match[1];
      const linkedFile = normalizeLinkedDocPath(file.path, linkedFileRaw);
      if (!linkedFile) continue;

      const count = refMap.get(linkedFile) || 0;
      refMap.set(linkedFile, count + 1);
    }
  }

  const references: FileReference[] = [];
  for (const [file, count] of refMap.entries()) {
    references.push({ file, count });
  }

  return references.sort((a, b) => b.count - a.count);
}

/**
 * タグ別にファイルを集計
 */
function aggregateByTag(files: DocFile[]): Map<string, DocFile[]> {
  const tagMap = new Map<string, DocFile[]>();

  for (const file of files) {
    if (file.tags) {
      for (const tag of file.tags) {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, []);
        }
        tagMap.get(tag)!.push(file);
      }
    }
  }

  return tagMap;
}

/**
 * INDEX.md を生成
 */
function generateIndex(
  files: DocFile[],
  dirStats: DirectoryStats[],
  references: FileReference[],
  tagMap: Map<string, DocFile[]>
): string {
  const now = new Date().toISOString().split('T')[0];

  let md = `---
title: ドキュメント総合目次
created: 2025-12-21
updated: ${now}
status: implemented
tags: [index, navigation]
---

# ドキュメント総合目次

**総ファイル数**: ${files.length}（自動集計）
**最終更新**: ${now}（自動生成）

---

## 📊 ディレクトリ別ファイル数

`;

  for (const stat of dirStats) {
    md += `- **${stat.name}/** (${stat.count})\n`;
  }

  md += `\n---\n\n## 🔗 重要ファイル（参照数順）\n\n`;
  md += `**⚠️ 以下のファイルはリンク多数につき移動・削除厳禁**\n\n`;

  const topReferences = references.slice(0, 10);
  for (let i = 0; i < topReferences.length; i++) {
    const ref = topReferences[i];
    md += `${i + 1}. [${path.basename(ref.file)}](${ref.file}) - ${ref.count} 参照\n`;
  }

  md += `\n---\n\n## 🏷️ タグ別索引\n\n`;

  const sortedTags = Array.from(tagMap.entries()).sort((a, b) => b[1].length - a[1].length);
  for (const [tag, tagFiles] of sortedTags.slice(0, 20)) {
    md += `### ${tag} (${tagFiles.length} files)\n\n`;
    for (const file of tagFiles.slice(0, 5)) {
      md += `- [${file.title}](${file.relativePath})\n`;
    }
    if (tagFiles.length > 5) {
      md += `- ...他 ${tagFiles.length - 5} 件\n`;
    }
    md += `\n`;
  }

  md += `---\n\n## ⚙️ 自動生成情報\n\n`;
  md += `- **生成日時**: ${now}\n`;
  md += `- **スクリプト**: \`scripts/generate-docs-index.ts\`\n`;
  md += `- **実行コマンド**: \`npm run generate-index\`\n\n`;

  md += `---\n\n## 📝 使用方法\n\n`;
  md += `### ステータスで検索\n\n`;
  md += '```bash\ngrep -r "status: implemented" docs --include="*.md"\n```\n\n';
  md += `### タグで検索\n\n`;
  md += '```bash\ngrep -r "tags:.*\\[.*ai.*\\]" docs --include="*.md"\n```\n\n';
  md += `### 最終更新日でソート\n\n`;
  md += '```bash\ngrep -r "^updated:" docs --include="*.md" | sort\n```\n';

  return md;
}

/**
 * メイン処理
 */
function main() {
  console.log('📄 docs/ ディレクトリをスキャン中...');
  const files = scanDocsDirectory();
  console.log(`✅ ${files.length} ファイルを検出`);

  console.log('📊 ディレクトリ別集計中...');
  const dirStats = aggregateByDirectory(files);

  console.log('🔗 参照数を集計中...');
  const references = countReferences(files);

  console.log('🏷️ タグ別集計中...');
  const tagMap = aggregateByTag(files);

  console.log('📝 INDEX.md を生成中...');
  const indexContent = generateIndex(files, dirStats, references, tagMap);

  fs.writeFileSync(INDEX_FILE, indexContent, 'utf-8');
  console.log(`✅ ${INDEX_FILE} を更新しました`);
}

main();
