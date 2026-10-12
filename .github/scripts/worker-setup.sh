#!/usr/bin/env bash
# Node and pnpm for the Worker deploy, in a job that does not use a setup action
# (deploy-worker.yaml's `setup_command`). The runner's default Node is older than
# the pnpm this repository pins needs (22.12), so take the Node 24 that `.nvmrc`
# names, put it first on PATH for this step and the next ones, enable the pnpm
# the `packageManager` field pins, and install exactly what the lockfile says.
set -euo pipefail

major=$(tr -d '[:space:]' <.nvmrc)
version=$(curl -fsSL "https://nodejs.org/dist/latest-v${major}.x/SHASUMS256.txt" | grep -o "node-v[0-9.]*-linux-x64.tar.xz" | head -1 | sed 's/^node-v//; s/-linux-x64.tar.xz$//')
dir="$RUNNER_TEMP/node-v${version}-linux-x64"
curl -fsSL "https://nodejs.org/dist/v${version}/node-v${version}-linux-x64.tar.xz" | tar -xJ -C "$RUNNER_TEMP"
export PATH="$dir/bin:$PATH"
echo "$dir/bin" >>"$GITHUB_PATH"

corepack enable
pnpm install --frozen-lockfile
