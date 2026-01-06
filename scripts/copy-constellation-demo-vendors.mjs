import { copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

const threeModuleSrc = path.join(root, 'node_modules', 'three', 'build', 'three.module.js');
const orbitControlsSrc = path.join(
  root,
  'node_modules',
  'three',
  'examples',
  'jsm',
  'controls',
  'OrbitControls.js'
);

const esModuleShimsSrc = path.join(
  root,
  'node_modules',
  'es-module-shims',
  'dist',
  'es-module-shims.js'
);

const vendorBaseDir = path.join(root, 'public', 'vendor');
const threeVendorDir = path.join(vendorBaseDir, 'three');
const threeModuleDest = path.join(threeVendorDir, 'three.module.js');
const orbitControlsDest = path.join(threeVendorDir, 'addons', 'controls', 'OrbitControls.js');

const esModuleShimsDest = path.join(vendorBaseDir, 'es-module-shims', 'es-module-shims.js');

async function isFile(filePath) {
  try {
    const s = await stat(filePath);
    return s.isFile();
  } catch {
    return false;
  }
}

async function ensureReadableOrThrow(filePath, hint) {
  const ok = await isFile(filePath);
  if (!ok) {
    throw new Error(
      `[copy-constellation-demo-vendors] Missing required file:\n` +
        `- ${filePath}\n\n` +
        `Hint: ${hint}`
    );
  }
}

async function main() {
  await ensureReadableOrThrow(
    threeModuleSrc,
    'Run `npm install` at repo root (nanashi8.github.io) to install three.'
  );
  await ensureReadableOrThrow(
    orbitControlsSrc,
    'Run `npm install` at repo root (nanashi8.github.io) to install three.'
  );
  await ensureReadableOrThrow(
    esModuleShimsSrc,
    'Run `npm install` at repo root (nanashi8.github.io) to install es-module-shims.'
  );

  await mkdir(path.dirname(threeModuleDest), { recursive: true });
  await mkdir(path.dirname(orbitControlsDest), { recursive: true });
  await mkdir(path.dirname(esModuleShimsDest), { recursive: true });

  await copyFile(threeModuleSrc, threeModuleDest);
  await copyFile(orbitControlsSrc, orbitControlsDest);
  await copyFile(esModuleShimsSrc, esModuleShimsDest);

  console.log('[copy-constellation-demo-vendors] OK:', path.relative(root, threeModuleDest));
  console.log('[copy-constellation-demo-vendors] OK:', path.relative(root, orbitControlsDest));
  console.log('[copy-constellation-demo-vendors] OK:', path.relative(root, esModuleShimsDest));
}

await main();
