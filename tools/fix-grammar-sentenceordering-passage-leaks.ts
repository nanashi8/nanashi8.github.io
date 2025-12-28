import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getSentenceOrderingCorrectAnswer } from '../src/utils/grammarQuestionIntegrity';
import { redactAnswerInPassage } from '../src/utils/passageRedaction';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const grammarDir = path.join(repoRoot, 'public', 'data', 'grammar');

async function walkFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip historical/backup directories
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

function stripTerminalPunctuation(text: string): string {
  return text.replace(/[\s]*[.,!?;:]+\s*$/g, '').trim();
}

function lastIndexOfCaseInsensitive(haystack: string, needle: string): number {
  return haystack.toLowerCase().lastIndexOf(needle.toLowerCase());
}

function hasSentenceOrderingLeak(passage: string, correctAnswer: string): boolean {
  const base = correctAnswer.trim();
  const baseNoPunct = stripTerminalPunctuation(base);
  return (
    lastIndexOfCaseInsensitive(passage, base) >= 0 ||
    (baseNoPunct.length > 0 && lastIndexOfCaseInsensitive(passage, baseNoPunct) >= 0)
  );
}

async function main(): Promise<void> {
  const files = await walkFiles(grammarDir);
  files.sort();

  let changedFiles = 0;
  let redactedCount = 0;

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const json = JSON.parse(raw);

    const questions: any[] = Array.isArray(json?.questions) ? json.questions : [];
    let changed = false;

    for (const q of questions) {
      if (q?.type !== 'sentenceOrdering') continue;
      if (typeof q?.passage !== 'string' || !q.passage.trim()) continue;

      const correctAnswer = getSentenceOrderingCorrectAnswer(q);
      if (!correctAnswer) continue;

      if (!hasSentenceOrderingLeak(q.passage, correctAnswer)) continue;

      const redacted = redactAnswerInPassage(q.passage, correctAnswer);
      if (redacted && redacted !== q.passage) {
        q.passage = redacted;
        changed = true;
        redactedCount += 1;
      }
    }

    if (changed) {
      changedFiles += 1;
      await fs.writeFile(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
    }
  }

  console.log('=== Fix sentenceOrdering passage leaks ===');
  console.log(`Files scanned: ${files.length}`);
  console.log(`Files changed: ${changedFiles}`);
  console.log(`Questions redacted: ${redactedCount}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
