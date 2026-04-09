#!/usr/bin/env bash
set -eu

echo "Setting up development environment..."

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
package_json_path="$repo_root/package.json"

desired_npm_version=""

if command -v node >/dev/null 2>&1 && [ -f "$package_json_path" ]; then
  desired_npm_version="$({
    PACKAGE_JSON_PATH="$package_json_path" node -e "
const fs = require('fs');
const filePath = process.env.PACKAGE_JSON_PATH;
try {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const packageManager = parsed.packageManager;
  if (typeof packageManager === 'string') {
    const match = packageManager.match(/^npm@(.+)$/);
    if (match) process.stdout.write(match[1]);
  }
} catch {}
"
  } || true)"
fi

if [ -n "$desired_npm_version" ] && command -v npm >/dev/null 2>&1; then
  current_npm_version="$(npm --version || true)"
  if [ "$current_npm_version" != "$desired_npm_version" ]; then
    echo "Aligning npm to $desired_npm_version from packageManager..."
    npm install -g "npm@$desired_npm_version" || echo "Unable to update npm automatically."
  fi
fi

if [ -f "$package_json_path" ]; then
  echo "Project manifest found at $package_json_path"
else
  echo "No package.json found at repo root yet."
fi

if command -v rg >/dev/null 2>&1; then
  echo "ripgrep is available."
else
  echo "ripgrep is not available in PATH."
fi

echo "Development environment is ready."
