#!/usr/bin/env bash
set -euo pipefail
export GIT_PAGER=cat

rm -f AUDIT-pass4-*

echo "▶ unimported (unused files)…"
npx -y unimported -f json > AUDIT-pass4-unimported.json || true

echo "▶ knip (unused files & exports)…"
npx -y knip --reporter json > AUDIT-pass4-knip.json || true

echo "▶ madge (orphans)…"
npx -y madge src --extensions js,jsx --exclude '^src/_archive' --orphans \
  > AUDIT-pass4-madge-orphans.txt || true

echo "▶ dependency-cruiser (no-orphans)…"
npx -y dependency-cruiser -v --config .dependency-cruiser.cjs --output-type text src \
  > AUDIT-pass4-depcruise.txt || true

echo
echo "Done. See:"
echo "  - AUDIT-pass4-unimported.json"
echo "  - AUDIT-pass4-knip.json"
echo "  - AUDIT-pass4-madge-orphans.txt"
echo "  - AUDIT-pass4-depcruise.txt"
