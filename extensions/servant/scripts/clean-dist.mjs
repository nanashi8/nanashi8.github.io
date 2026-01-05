import { rm } from 'node:fs/promises';

try {
  await rm(new URL('../dist', import.meta.url), { recursive: true, force: true });
} catch {
  // ignore
}
