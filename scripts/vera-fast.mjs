#!/usr/bin/env node
/**
 * Vera Fast - ESLint on changed .ts/.tsx + Vera Logic (repo rules/contracts).
 * Usage: node scripts/vera-fast.mjs
 */
import { execSync } from 'node:child_process';
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

let failed = false;

if (files.length === 0) {
  console.log('🧪 Vera fast: no changed TS/TSX files - eslint skipped.');
} else {
  console.log(`🧪 Vera fast: eslint on ${files.length} file(s)`);
  const eslint = spawnSync('npx', ['eslint', '--no-warn-ignored', ...files], {
    stdio: 'inherit',
    shell: true,
  });
  if ((eslint.status ?? 1) !== 0) {
    console.log('❌ Vera fast: eslint failed');
    failed = true;
  } else {
    console.log('✅ Vera fast: eslint passed');
  }
}

try {
  execSync('node scripts/vera-logic.mjs', {
    stdio: 'inherit',
    encoding: 'utf8',
  });
} catch {
  failed = true;
}

if (failed) {
  console.log('❌ Vera fast: failed');
  process.exit(1);
}

console.log('✅ Vera fast: passed (eslint + logic)');
process.exit(0);
