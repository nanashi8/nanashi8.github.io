import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const grammarDir = path.join(repoRoot, 'public', 'data', 'grammar');

type FixStats = {
  filesScanned: number;
  filesChanged: number;
  sentenceMasked: number;
  passageMasked: number;
};

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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceLastWholeWordCI(text: string, word: string, replacement: string): string {
  const w = String(word || '').trim();
  if (!w) return text;

  // Whole-word match; keep apostrophes inside word (don't, I'm).
  // Using \b around the escaped word is acceptable here because answers are single tokens.
  // NOTE: RegExp constructor needs the pattern string to contain "\\b".
  const re = new RegExp(`\\b${escapeRegex(w)}\\b`, 'ig');

  let lastMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while (true) {
    m = re.exec(text);
    if (m === null) break;
    lastMatch = m;
  }

  if (!lastMatch) return text;
  const idx = lastMatch.index;
  return text.slice(0, idx) + replacement + text.slice(idx + lastMatch[0].length);
}

function includesWholeWordCI(text: string, word: string): boolean {
  const w = String(word || '').trim();
  if (!w) return false;
  if (w.length < 3) return false; // avoid is/am/are noise
  const re = new RegExp(`\\b${escapeRegex(w)}\\b`, 'i');
  return re.test(text);
}

async function main(): Promise<void> {
  const files = await walkFiles(grammarDir);
  files.sort();

  const stats: FixStats = {
    filesScanned: files.length,
    filesChanged: 0,
    sentenceMasked: 0,
    passageMasked: 0,
  };

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const json = JSON.parse(raw);

    const questions: any[] = Array.isArray(json?.questions) ? json.questions : [];
    let changed = false;

    for (const q of questions) {
      const type = String(q?.type || '');
      if (type !== 'fillInBlank' && type !== 'verbForm') continue;

      const correctAnswer = String(q?.correctAnswer || '').trim();
      if (!correctAnswer) continue;

      // Fix sentence leak: if the sentence already includes the correct answer and has no blank, replace it.
      if (typeof q?.sentence === 'string' && q.sentence) {
        const hasBlank = /_{2,}/.test(q.sentence);
        if (!hasBlank && includesWholeWordCI(q.sentence, correctAnswer)) {
          const updated = replaceLastWholeWordCI(q.sentence, correctAnswer, '____');
          if (updated !== q.sentence) {
            q.sentence = updated;
            changed = true;
            stats.sentenceMasked += 1;
          }
        }
      }

      // Fix passage leak: if passage contains correct answer as a whole word, redact last occurrence.
      if (typeof q?.passage === 'string' && q.passage) {
        if (includesWholeWordCI(q.passage, correctAnswer)) {
          const updated = replaceLastWholeWordCI(q.passage, correctAnswer, '____');
          if (updated !== q.passage) {
            q.passage = updated;
            changed = true;
            stats.passageMasked += 1;
          }
        }
      }
    }

    if (changed) {
      stats.filesChanged += 1;
      await fs.writeFile(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
    }
  }

  console.log('=== Fix fillInBlank/verbForm leaks ===');
  console.log(`Files scanned: ${stats.filesScanned}`);
  console.log(`Files changed: ${stats.filesChanged}`);
  console.log(`Sentences masked: ${stats.sentenceMasked}`);
  console.log(`Passages masked: ${stats.passageMasked}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
