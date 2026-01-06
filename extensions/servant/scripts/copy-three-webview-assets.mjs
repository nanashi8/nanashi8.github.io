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

const vendorDir = path.join(root, 'media', 'vendor', 'three');
const threeModuleDest = path.join(vendorDir, 'three.module.js');
const orbitControlsDest = path.join(vendorDir, 'OrbitControls.js');

async function ensureReadable(filePath) {
  try {
    const s = await stat(filePath);
    return s.isFile();
  } catch {
    return false;
  }
}

async function main() {
  const hasThree = await ensureReadable(threeModuleSrc);
  const hasOrbit = await ensureReadable(orbitControlsSrc);

  if (!hasThree || !hasOrbit) {
    const missing = [
      !hasThree ? threeModuleSrc : null,
      !hasOrbit ? orbitControlsSrc : null,
    ].filter(Boolean);

    throw new Error(
      `[copy-three-webview-assets] Missing required Three.js files.\n` +
        `Run \"npm install\" in extensions/servant first.\n` +
        `Missing:\n- ${missing.join('\n- ')}`
    );
  }

  await mkdir(vendorDir, { recursive: true });
  await copyFile(threeModuleSrc, threeModuleDest);
  await copyFile(orbitControlsSrc, orbitControlsDest);

  console.log('[copy-three-webview-assets] OK:', path.relative(root, threeModuleDest));
  console.log('[copy-three-webview-assets] OK:', path.relative(root, orbitControlsDest));
}

await main();
