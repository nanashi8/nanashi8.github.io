/**
 * Document Component System - Markdown Parser
 *
 * Markdownファイルの解析（リンク抽出、frontmatter抽出）
 */

import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import type { MarkdownLink, Frontmatter } from './types.js';

/**
 * Markdownファイルからリンクを抽出
 */
export function extractMarkdownLinks(filePath: string): MarkdownLink[] {
  const content = readFileSync(filePath, 'utf-8');
  const links: MarkdownLink[] = [];

  // Markdownリンクの正規表現: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;

    while ((match = linkRegex.exec(line)) !== null) {
      const text = match[1];
      const href = match[2];

      // 画像リンクは除外（![alt](url)）
      const maybeImagePrefix = match.index > 0 ? line[match.index - 1] : '';
      if (maybeImagePrefix === '!') {
        continue;
      }

      // 外部リンク、アンカーリンク、画像は除外
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
        continue;
      }

      links.push({
        text,
        href,
        line: i + 1,
      });
    }
  }

  return links;
}

/**
 * Markdownファイルからfrontmatterを抽出
 */
export function extractFrontmatter(filePath: string): Frontmatter | null {
  const content = readFileSync(filePath, 'utf-8');

  // frontmatterの正規表現: ---\n...\n---
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return null;
  }

  try {
    const frontmatter = parseYaml(match[1]) as Frontmatter;
    return frontmatter;
  } catch (error) {
    console.warn(`Failed to parse frontmatter in ${filePath}:`, error);
    return null;
  }
}

/**
 * 相対パスを絶対パスに解決
 */
export function resolveRelativePath(basePath: string, relativePath: string): string {
  const baseParts = basePath.split('/').slice(0, -1); // ファイル名を除く
  const relativeParts = relativePath.split('/');

  for (const part of relativeParts) {
    if (part === '.') {
      continue;
    } else if (part === '..') {
      baseParts.pop();
    } else {
      baseParts.push(part);
    }
  }

  return baseParts.join('/');
}

/**
 * Markdownリンクをファイルパスに正規化
 */
export function normalizeMarkdownLink(link: string): string {
  // アンカーリンクを除去
  const withoutAnchor = link.split('#')[0];

  // すでに拡張子がある場合はそのまま（.mjs/.ts/.yml などに .md を付けない）
  if (/\.[a-z0-9]+$/i.test(withoutAnchor)) {
    return withoutAnchor;
  }

  // .md拡張子がなければ追加
  if (!withoutAnchor.endsWith('.md')) {
    return withoutAnchor + '.md';
  }

  return withoutAnchor;
}
