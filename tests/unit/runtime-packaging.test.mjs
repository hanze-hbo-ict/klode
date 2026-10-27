import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { vendorRuntime } from '../../scripts/vendor-runtime.mjs';
import { runtimeVersion, runtimeHashes } from '../../runtime-config.js';

async function fixture(t) {
  const path = await mkdtemp(join(tmpdir(), 'klode-runtime-'));
  t.after(() => rm(path, { recursive: true, force: true }));
  const root = pathToFileURL(`${path}/`);
  const source = new URL('node_modules/pyodide/', root);
  await mkdir(source, { recursive: true });
  await writeFile(new URL('package.json', source), JSON.stringify({ version: runtimeVersion }));
  for (const file of Object.keys(runtimeHashes)) {
    await writeFile(new URL(file, source), await readFile(new URL(`../../node_modules/pyodide/${file}`, import.meta.url)));
  }
  return { root, source, output: new URL('public/runtime/', root) };
}

async function tree(directory) {
  const entries = {};
  for (const name of (await readdir(directory)).sort()) {
    const file = new URL(name, directory);
    try {
      entries[name] = await tree(new URL(`${name}/`, directory));
    } catch (error) {
      if (error.code !== 'ENOTDIR') throw error;
      entries[name] = await readFile(file);
    }
  }
  return entries;
}

test('rebuilding removes prior generated assets and matches clean output', async (t) => {
  const { root, output } = await fixture(t);
  await vendorRuntime(root);
  const clean = await tree(output);
  const old = new URL('0.0.1/', output);
  await mkdir(old);
  for (const file of Object.keys(runtimeHashes)) await writeFile(new URL(file, old), 'stale');
  await vendorRuntime(root);
  assert.deepEqual(await tree(output), clean);
});

test('packaging preserves notices, credentials and unrelated files in old versions', async (t) => {
  const { root, output } = await fixture(t);
  const old = new URL('0.0.1/', output);
  await mkdir(old, { recursive: true });
  for (const file of ['NOTICE.md', '.credentials']) await writeFile(new URL(file, output), 'keep');
  await writeFile(new URL('unrelated.txt', old), 'keep');
  await writeFile(new URL('pyodide.mjs', old), 'stale');
  await vendorRuntime(root);
  assert.deepEqual(await readdir(old), ['unrelated.txt']);
  for (const file of ['NOTICE.md', '.credentials']) assert.equal(await readFile(new URL(file, output), 'utf8'), 'keep');
});

test('checksum failure preserves previous output instead of partially replacing it', async (t) => {
  const { root, source, output } = await fixture(t);
  await vendorRuntime(root);
  const before = await tree(output);
  await writeFile(new URL('pyodide.mjs', source), 'corrupted');
  await assert.rejects(vendorRuntime(root), /Runtime checksum mismatch/);
  assert.deepEqual(await tree(output), before);
});

test('installed version drift is rejected before packaging', async (t) => {
  const { root, source } = await fixture(t);
  await writeFile(new URL('package.json', source), JSON.stringify({ version: '0.0.1' }));
  await assert.rejects(vendorRuntime(root), /Expected Pyodide/);
});

test('numeric directory symlinks are refused without following or deleting their target', async (t) => {
  const { root, output } = await fixture(t);
  const outside = new URL('unrelated/', root);
  await mkdir(outside);
  await writeFile(new URL('pyodide.mjs', outside), 'keep');
  await mkdir(output, { recursive: true });
  await symlink(outside, new URL('0.0.1', output));
  await assert.rejects(vendorRuntime(root), /Runtime directory is a symlink/);
  assert.equal(await readFile(new URL('pyodide.mjs', outside), 'utf8'), 'keep');
});
