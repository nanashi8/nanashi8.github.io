#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const missingFiles = [
  'docs/private/qiita-started-2026-01-03/01-adaptive-guard-system.md',
  'docs/private/qiita-started-2026-01-03/02-ai-realtime-guard-workflow.md',
  'docs/private/qiita-started-2026-01-03/03-ai-failure-collection-pilot.md',
  'docs/private/qiita-started-2026-01-03/04-ai-warning-system.md',
  'docs/private/qiita-started-2026-01-03/05-maintenance-ai-and-quality-nerve.md',
  'docs/private/qiita-started-2026-01-03/06-ml-ops-in-browser.md',
  'docs/private/qiita-started-2026-01-03/07-meta-ai-as-a-product.md',
  'docs/private/qiita-started-2026-01-03/README.md',
  'docs/references/high-school-exam-priority-terms.md',
  'docs/references/tokyo-shoseki-units-research.md',
  'docs/reports/reading-hints-implementation-report.md',
];

const componentsFile = path.resolve(__dirname, '../docs/_components.yaml');
const content = fs.readFileSync(componentsFile, 'utf-8');
const lines = content.split('\n');
const linesToRemove = new Set();

console.log('🔍 追加の存在しないファイルを検索...');

missingFiles.forEach((filePath) => {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed === `${filePath}:` && line.startsWith('  ') && !line.startsWith('    ')) {
      console.log(`Found: ${filePath} at line ${i + 1}`);
      linesToRemove.add(i);
      
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        if (nextLine.trim() === '') {
          linesToRemove.add(j);
          continue;
        }
        if (nextLine.startsWith('  ') && !nextLine.startsWith('    ') && nextLine.trim().endsWith(':')) {
          break;
        }
        if (!nextLine.startsWith('  ')) {
          break;
        }
        linesToRemove.add(j);
      }
      break;
    }
  }
});

const cleanedLines = lines.filter((_, index) => !linesToRemove.has(index));
const backupFile = `${componentsFile}.backup-${Date.now()}`;
fs.copyFileSync(componentsFile, backupFile);
fs.writeFileSync(componentsFile, cleanedLines.join('\n'), 'utf-8');

console.log(`✅ 完了: ${linesToRemove.size}行削除`);
console.log(`残った行数: ${cleanedLines.length} (元: ${lines.length})`);
