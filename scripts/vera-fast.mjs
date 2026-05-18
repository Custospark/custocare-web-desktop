#!/usr/bin/env node
/**
 * Vera Fast — ESLint on changed TS/TSX only (~seconds).
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const TS_PATTERN = /\.(ts|tsx)$/;

function gitLines(command) {
  const result = spawnSync(command, { shell: true, encoding: 'utf8' });
  if (result.status !== 0 && !result.stdout) {
    return [];
  }
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function collectChangedTsFiles() {
  const commands = [
    'git diff --name-only --diff-filter=ACMRTUXB HEAD',
    'git diff --cached --name-only --diff-filter=ACMRTUXB',
  ];
  const files = new Set();

  for (const command of commands) {
    for (const path of gitLines(command)) {
      if (TS_PATTERN.test(path) && existsSync(path)) {
        files.add(path);
      }
    }
  }

  return [...files];
}

const files = collectChangedTsFiles();

if (files.length === 0) {
  console.log('🧪 Vera fast: no changed TS/TSX files — skipped.');
  process.exit(0);
}

console.log(`🧪 Vera fast: eslint on ${files.length} file(s)`);

const eslint = spawnSync('npx', ['eslint', ...files], {
  stdio: 'inherit',
  shell: true,
});

process.exit(eslint.status ?? 1);
