#!/usr/bin/env bash
set -eu

warn() {
  echo "WARNING: $1"
}

workspace_dir="${containerWorkspaceFolder:-$(pwd)}"

echo "Devcontainer ready."
echo
echo "Node.js version:"
if command -v node >/dev/null 2>&1; then
  node --version || warn "Unable to run node --version"
else
  warn "node is not available on PATH"
fi

echo
echo "npm version:"
if command -v npm >/dev/null 2>&1; then
  npm --version || warn "Unable to run npm --version"
else
  warn "npm is not available on PATH"
fi

echo
git config --global --add safe.directory "$workspace_dir"

if [ -f "$workspace_dir/package.json" ]; then
  echo "Installing npm dependencies..."
  npm install
else
  echo "No package.json found yet. Skipping npm install."
fi
