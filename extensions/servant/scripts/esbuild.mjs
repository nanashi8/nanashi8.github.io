import { build, context } from 'esbuild';
import process from 'node:process';

import './copy-three-webview-assets.mjs';

const isWatch = process.argv.includes('--watch');

const common = {
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.js',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'es2022',
  sourcemap: true,
  sourcesContent: false,
  logLevel: 'info',
  external: ['vscode'],
};

if (isWatch) {
  const ctx = await context(common);
  await ctx.watch();
  console.log('[esbuild] watching...');
} else {
  await build(common);
}
