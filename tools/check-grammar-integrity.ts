import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateAndSanitizeGrammarQuestion } from '../src/utils/grammarQuestionIntegrity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const grammarDir = path.join(repoRoot, 'public', 'data', 'grammar');

type FatalItem = {
  file: string;
  id: string | undefined;
  type: string | undefined;
  fatalIssues: string[];
};

type WarningItem = {
  file: string;
  id: string | undefined;
  type: string | undefined;
  warnings: string[];
};

async function walkFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip historical/backup directories
    if (entry.isDirectory()) {
      if (
        entry.name.includes('backup') ||
        entry.name.includes('archive') ||
        entry.name.includes('old')
      ) {
        continue;
      }
      files.push(...(await walkFiles(fullPath)));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.json')) continue;
    if (!/^grammar_grade\d+_unit\d+\.json$/.test(entry.name)) continue;

    files.push(fullPath);
  }

  return files;
}

function rel(p: string): string {
  return path.relative(repoRoot, p);
}

async function main(): Promise<void> {
  const files = await walkFiles(grammarDir);
  files.sort();

  const fatals: FatalItem[] = [];
  const warnings: WarningItem[] = [];

  const warningIssueCounts: Record<string, number> = {};
  const warningTypeCounts: Record<string, number> = {};
  const warningTypeIssueCounts: Record<string, number> = {};

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    let json: any;
    try {
      json = JSON.parse(raw);
    } catch {
      fatals.push({
        file: rel(file),
        id: undefined,
        type: undefined,
        fatalIssues: ['invalid_json'],
      });
      continue;
    }

    const questions: any[] = Array.isArray(json?.questions) ? json.questions : [];
    for (const q of questions) {
      const { report } = validateAndSanitizeGrammarQuestion(q);
      if (!report.ok) {
        fatals.push({
          file: rel(file),
          id: q?.id,
          type: q?.type,
          fatalIssues: report.fatalIssues,
        });
      } else if (report.warnings.length > 0) {
        const type = String(q?.type ?? '');

        warningTypeCounts[type] = (warningTypeCounts[type] || 0) + 1;
        for (const w of report.warnings) {
          warningIssueCounts[w] = (warningIssueCounts[w] || 0) + 1;
          warningTypeIssueCounts[`${type}::${w}`] =
            (warningTypeIssueCounts[`${type}::${w}`] || 0) + 1;
        }

        warnings.push({
          file: rel(file),
          id: q?.id,
          type,
          warnings: report.warnings,
        });
      }
    }
  }

  const byFileFatal: Record<string, number> = {};
  for (const f of fatals) byFileFatal[f.file] = (byFileFatal[f.file] || 0) + 1;

  console.log('=== Grammar Integrity Report ===');
  console.log(`Files scanned: ${files.length}`);
  console.log(`Fatal questions: ${fatals.length}`);
  console.log(`Warning questions: ${warnings.length}`);

  if (fatals.length > 0) {
    console.log('\n--- Fatal summary (by file) ---');
    Object.entries(byFileFatal)
      .sort((a, b) => b[1] - a[1])
      .forEach(([file, count]) => {
        console.log(`${count}\t${file}`);
      });

    console.log('\n--- Fatal details ---');
    for (const item of fatals) {
      console.log(
        `${item.file}\t${item.id ?? '(no id)'}\t${item.type ?? '(no type)'}\t${item.fatalIssues.join(',')}`
      );
    }
  }

  if (warnings.length > 0) {
    console.log('\n--- Warning summary (by type) ---');
    Object.entries(warningTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`${count}\t${type || '(empty type)'}`);
      });

    console.log('\n--- Warning summary (by issue) ---');
    Object.entries(warningIssueCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([issue, count]) => {
        console.log(`${count}\t${issue}`);
      });

    console.log('\n--- Warning summary (by type+issue, top 30) ---');
    Object.entries(warningTypeIssueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .forEach(([key, count]) => {
        console.log(`${count}\t${key}`);
      });

    console.log('\n--- Warning details (first 50) ---');
    for (const item of warnings.slice(0, 50)) {
      console.log(
        `${item.file}\t${item.id ?? '(no id)'}\t${item.type ?? '(no type)'}\t${item.warnings.join(',')}`
      );
    }
    if (warnings.length > 50) {
      console.log(`... (${warnings.length - 50} more warnings)`);
    }
  }

  if (fatals.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
