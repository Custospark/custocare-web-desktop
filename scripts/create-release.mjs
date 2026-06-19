#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { request } from 'node:https';

const { GH_TOKEN } = process.env;
if (!GH_TOKEN) {
  console.error('Missing $GH_TOKEN — skipping release creation');
  process.exit(0);
}

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
const tag = `v${pkg.version}`;

const body = JSON.stringify({
  tag_name: tag,
  target_commitish: 'main',
  name: tag,
  draft: false,
  prerelease: false,
  generate_release_notes: true,
});

const options = {
  hostname: 'api.github.com',
  path: '/repos/Custospark/custocare-web-desktop/releases',
  method: 'POST',
  headers: {
    Authorization: `token ${GH_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'custocare-release-script',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    if (res.statusCode === 201) {
      const { html_url } = JSON.parse(data);
      console.log(`✅ Release created: ${html_url}`);
      process.exit(0);
    } else if (res.statusCode === 422) {
      // Release already exists — nothing to do
      console.log(`ℹ️  Release ${tag} already exists — skipping`);
      process.exit(0);
    } else {
      const msg = JSON.parse(data).message ?? res.statusCode;
      console.error(`❌ Failed to create release (${res.statusCode}): ${msg}`);
      process.exit(0); // Don't block the build
    }
  });
});

req.on('error', (err) => {
  console.error(`❌ Request failed: ${err.message}`);
  process.exit(0); // Don't block the build
});

req.write(body);
req.end();
