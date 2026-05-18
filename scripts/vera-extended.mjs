#!/usr/bin/env node
/**
 * Vera Extended — fast checks + optional typecheck when TS types changed.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function gitLines(command) {
  const result = spawnSync(command, { shell: true, encoding: 'utf8' });
  if (result.status !== 0 && !result.stdout) {
    return [];
  }
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function collectChangedPaths() {
  const commands = [
    'git diff --name-only --diff-filter=ACMRTUXB HEAD',
    'git diff --cached --name-only --diff-filter=ACMRTUXB',
  ];
  const files = new Set();

  for (const command of commands) {
    for (const path of gitLines(command)) {
      if (existsSync(path) || path.endsWith('.ts') || path.endsWith('.tsx')) {
        files.add(path);
      }
    }
  }

  return [...files];
}

const fast = spawnSync('node', ['scripts/vera-fast.mjs'], { stdio: 'inherit', shell: true });
if ((fast.status ?? 1) !== 0) {
  process.exit(fast.status ?? 1);
}

const changed = collectChangedPaths();
const needsTypecheck = changed.some(
  (path) =>
    /Types?\.ts$/i.test(path) ||
    path.includes('/api/') ||
    path.includes('/store/'),
);

if (!needsTypecheck) {
  console.log('🧪 Vera extended: no type-surface changes — skipped tsc.');
  process.exit(0);
}

console.log('🧪 Vera extended: tsc -b (renderer project)');

const tsc = spawnSync(
  'node',
  [
    '--max-old-space-size=8192',
    './node_modules/typescript/bin/tsc',
    '-b',
    '--pretty',
    'false',
  ],
  { stdio: 'inherit', shell: true },
);

process.exit(tsc.status ?? 1);
