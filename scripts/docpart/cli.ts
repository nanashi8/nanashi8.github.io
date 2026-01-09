#!/usr/bin/env node
/**
 * Document Component System - CLI Entry Point
 * 
 * Usage:
 *   npm run docpart init [--force] [--config=path]
 *   npm run docpart lint [--config=path]
 *   npm run docpart graph [--config=path]
 */

import { initCommand } from './init.js';
import { lintCommand } from './lint.js';
import { graphCommand } from './graph.js';

const args = process.argv.slice(2);
const command = args[0];

// オプション解析
const options: Record<string, string | boolean> = {};
for (const arg of args.slice(1)) {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    options[key] = value ?? true;
  }
}

async function main() {
  try {
    switch (command) {
      case 'init':
        await initCommand({
          configPath: options.config as string | undefined,
          force: options.force as boolean | undefined,
        });
        break;

      case 'lint':
        await lintCommand({
          configPath: options.config as string | undefined,
        });
        break;

      case 'graph':
        await graphCommand({
          configPath: options.config as string | undefined,
        });
        break;

      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Document Component System (DocPart)

Usage:
  npm run docpart <command> [options]

Commands:
  init          Analyze existing docs and generate initial component mapping
  lint          Validate component mapping and detect issues
  graph         Generate dependency graph (Mermaid + JSON)
  help          Show this help message

Options:
  --config=<path>   Path to .docpartrc.yaml (default: auto-detect)
  --force           Force overwrite existing files (init only)

Examples:
  npm run docpart init
  npm run docpart init --force
  npm run docpart lint
  npm run docpart graph
  npm run docpart init --config=custom-config.yaml

Documentation:
  See docs/design/DOCPART_SPECIFICATION.md for details
`);
}

main();
