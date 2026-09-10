/**
 * Vera Logic - repo rules & contracts (not ESLint).
 * Runs on every Vera Fast handoff after lint.
 * Ported from Custosell; rules below are the generic subset.
 *
 * Usage: node scripts/vera-logic.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const MAX_LINES = 500;

/** @typedef {{ id: string, ok: boolean, detail: string }} RuleResult */

function read(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

function lineCount(relPath) {
  const text = read(relPath);
  if (text == null) return 0;
  return text.split(/\r?\n/).length;
}

function getChangedTsFiles() {
  const commands = [
    'git diff --name-only --diff-filter=ACMRTUXB HEAD',
    'git diff --cached --name-only --diff-filter=ACMRTUXB',
    'git ls-files --others --exclude-standard',
  ];
  const files = new Set();
  for (const cmd of commands) {
    try {
      const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      for (const line of out.split('\n')) {
        const trimmed = line.trim().replace(/\\/g, '/');
        if (
          trimmed
          && (trimmed.endsWith('.ts') || trimmed.endsWith('.tsx'))
          && trimmed.startsWith('src/')
        ) {
          files.add(trimmed);
        }
      }
    } catch {
      // ignore
    }
  }
  return [...files];
}

function getChangedFiles() {
  const commands = [
    'git diff --name-only --diff-filter=ACMRTUXB HEAD',
    'git diff --cached --name-only --diff-filter=ACMRTUXB',
    'git ls-files --others --exclude-standard',
  ];
  const files = new Set();
  for (const cmd of commands) {
    try {
      const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      for (const line of out.split('\n')) {
        const trimmed = line.trim().replace(/\\/g, '/');
        if (trimmed) {
          files.add(trimmed);
        }
      }
    } catch {
      // ignore
    }
  }
  return [...files];
}

/** Resolve a relative import specifier to an existing file under ROOT. */
function relativeImportExists(fromFile, specifier) {
  const clean = specifier.split('?')[0];
  if (!clean.startsWith('.')) return true;
  const fromDir = path.dirname(path.join(ROOT, fromFile));
  const base = path.resolve(fromDir, clean);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.css`,
    `${base}.json`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
  ];
  const srcBase = clean.replace(/\.(js|jsx|mjs)$/, (_, ext) => `.${ext === 'mjs' ? 'mts' : ext === 'jsx' ? 'tsx' : 'ts'}`);
  if (srcBase !== clean) {
    candidates.push(path.resolve(fromDir, srcBase));
  }
  return candidates.some((candidate) => fs.existsSync(candidate));
}

/** @returns {RuleResult} */
function checkRelativeImports(changedFiles) {
  const importRe = /(?:from\s+|import\s*\(\s*)['"](\.[^'"]+)['"]/g;
  const broken = [];

  for (const file of changedFiles) {
    const text = read(file);
    if (text == null) continue;
    importRe.lastIndex = 0;
    let match;
    while ((match = importRe.exec(text)) !== null) {
      const spec = match[1];
      if (!spec) continue;
      if (!relativeImportExists(file, spec)) {
        broken.push(`${file} -> ${spec}`);
      }
    }
  }

  if (broken.length) {
    return {
      id: 'relative-imports',
      ok: false,
      detail: `Unresolved relative import(s): ${broken.slice(0, 8).join('; ')}${broken.length > 8 ? ` (+${broken.length - 8} more)` : ''}`,
    };
  }

  return {
    id: 'relative-imports',
    ok: true,
    detail: changedFiles.length
      ? `Relative imports resolve for ${changedFiles.length} changed file(s)`
      : 'No changed TS/TSX under src/ - import check skipped',
  };
}

function headLineCount(relPath) {
  try {
    const out = execSync(`git show HEAD:${relPath}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return out.split('\n').length;
  } catch {
    return null; // new file - enforce strictly
  }
}

/** @returns {RuleResult[]} */
function checkFileSizeLimit(changedFiles) {
  const results = [];
  for (const file of changedFiles) {
    const lines = lineCount(file);
    if (lines <= MAX_LINES) continue;
    // Grandfathered: already over the limit at HEAD (splitting it is
    // separate tech-debt work, not a gate on every change).
    const headLines = headLineCount(file);
    if (headLines != null && headLines > MAX_LINES) continue;
    results.push({
      id: 'file-size-500',
      ok: false,
      detail: `${file} has ${lines} lines (max ${MAX_LINES}) - split into smaller units`,
    });
  }

  if (results.length === 0) {
    results.push({
      id: 'file-size-500',
      ok: true,
      detail: changedFiles.length
        ? `All ${changedFiles.length} changed file(s) within ${MAX_LINES} lines`
        : 'No changed TS/TSX - size check skipped',
    });
  }
  return results;
}

// Extensions / paths treated as binary or vendored (reused from normalize-dashes.mjs).
const BINARY_EXT = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico', '.woff', '.woff2',
  '.ttf', '.eot', '.mp3', '.mp4', '.pdf', '.zip', '.gz', '.wasm',
]);
const SKIP_PATHS = ['/node_modules/', '/vendor/', '/dist/', '/.git/'];

function isTextFile(relPath) {
  if (SKIP_PATHS.some((p) => relPath.includes(p))) return false;
  const ext = relPath.toLowerCase().slice(relPath.lastIndexOf('.'));
  return !BINARY_EXT.has(ext);
}

/** @returns {RuleResult} */
function checkNoLongDashes(changedFiles) {
  const offenders = [];
  for (const file of changedFiles) {
    if (!isTextFile(file)) continue;
    const text = read(file);
    if (text == null) continue;
    if (/[\u2014\u2013]/.test(text)) {
      offenders.push(file);
    }
  }
  if (offenders.length) {
    return {
      id: 'no-long-dashes',
      ok: false,
      detail: `Long dash (em/en) found in changed file(s): ${offenders.slice(0, 8).join(', ')}${offenders.length > 8 ? ` (+${offenders.length - 8} more)` : ''} - run node scripts/normalize-dashes.mjs`,
    };
  }
  return {
    id: 'no-long-dashes',
    ok: true,
    detail: 'No em/en dashes in changed files',
  };
}

const changed = getChangedTsFiles();
const results = [
  ...checkFileSizeLimit(changed),
  checkRelativeImports(changed),
  checkNoLongDashes(getChangedFiles()),
];

const failed = results.filter((r) => !r.ok);

console.log(`🧪 Vera logic: ${results.length} rule(s)`);
for (const r of results) {
  console.log(`  ${r.ok ? '✅' : '❌'} [${r.id}] ${r.detail}`);
}

if (failed.length) {
  console.log(`❌ Vera logic: failed (${failed.length})`);
  process.exit(1);
}

console.log('✅ Vera logic: passed');
process.exit(0);
