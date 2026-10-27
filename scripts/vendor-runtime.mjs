import { readFile, mkdir, readdir, rmdir, unlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { runtimeVersion, runtimePath, runtimeHashes } from '../runtime-config.js';

export async function vendorRuntime(root = new URL('../', import.meta.url)) {
  const pkg = JSON.parse(await readFile(new URL('node_modules/pyodide/package.json', root)));
  if (pkg.version !== runtimeVersion) throw new Error(`Expected Pyodide ${runtimeVersion}`);

  // Validate every input before changing any previously packaged output.
  const assets = new Map();
  for (const [file, expected] of Object.entries(runtimeHashes)) {
    const bytes = await readFile(new URL(`node_modules/pyodide/${file}`, root));
    if (createHash('sha256').update(bytes).digest('hex') !== expected) {
      throw new Error(`Runtime checksum mismatch: ${file}`);
    }
    assets.set(file, bytes);
  }

  const directory = new URL('public/runtime/', root);
  await mkdir(directory, { recursive: true });
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!/^\d+\.\d+\.\d+$/.test(entry.name)) continue;
    if (entry.isSymbolicLink()) throw new Error(`Runtime directory is a symlink: ${entry.name}`);
    if (!entry.isDirectory()) continue;
    const versionDirectory = new URL(`${entry.name}/`, directory);
    // Only these filenames in numeric version directories are owned generated
    // assets. Never recursively delete a version directory or its other files.
    for (const file of Object.keys(runtimeHashes)) {
      try {
        await unlink(new URL(file, versionDirectory));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    if ((await readdir(versionDirectory)).length === 0) await rmdir(versionDirectory);
  }

  const target = new URL(`public${runtimePath}`, root);
  await mkdir(target, { recursive: true });
  let total = 0;
  for (const [file, bytes] of assets) {
    await writeFile(new URL(file, target), bytes);
    total += bytes.length;
  }
  return `Verified and packaged Pyodide ${runtimeVersion}: ${total} bytes; no network downloads.`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(await vendorRuntime());
}
