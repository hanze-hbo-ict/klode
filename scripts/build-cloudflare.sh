#!/usr/bin/env bash
# Cloudflare Pages build command (see docs/hosting.md).
# Installs locked dependencies with the npm version pinned in package.json,
# builds the static site and adds the Cloudflare Pages response headers.
set -euo pipefail
cd "$(dirname "$0")/.."

npm_version="$(node -p "require('./package.json').packageManager.replace(/^npm@/, '')")"
npx --yes "npm@${npm_version}" ci
npx --yes "npm@${npm_version}" run build
cp cloudflare/_headers dist/_headers
