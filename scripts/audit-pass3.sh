#!/usr/bin/env bash
set -euo pipefail
export GIT_PAGER=cat

STAMP="$(date +%F)"

# 0) Refresh ESLint unused-exports (only if the temp rc exists)
if [ -f .eslintrc.tmp.json ]; then
  npx -y eslint@8.57.0 "src/**/*.{js,jsx}" -c .eslintrc.tmp.json > AUDIT-eslint-unused-pass3.txt || true
fi

# 1) Build target lists (exclude archived)
find src/hooks    -type f \( -name "*.js" -o -name "*.jsx" \) ! -path "*/_archive/*" | sort > AUDIT-pass3-hooks-all.txt || true
find src/utils    -type f \( -name "*.js" -o -name "*.jsx" \) ! -path "*/_archive/*" | sort > AUDIT-pass3-utils-all.txt || true
find src/services -type f \( -name "*.js" -o -name "*.jsx" \) ! -path "*/_archive/*" | sort > AUDIT-pass3-services-all.txt || true

check_batch () {
  local list_file="$1"; local tag="$2"
  : > "AUDIT-pass3-${tag}-importers.txt"
  : > "AUDIT-pass3-${tag}-unused.txt"

  while read -r f; do
    [ -f "$f" ] || continue
    echo "=== $f" | tee -a "AUDIT-pass3-${tag}-importers.txt"
    base="$(basename "${f%.*}")"

    hits="$(git grep -n -E "from ['\"][^'\"]*${base}(\.jsx?)?['\"]|require\(['\"][^'\"]*${base}(\.jsx?)?['\"]\)" -- src 2>/dev/null \
            | grep -v "/_archive/" | grep -v -F "$f" || true)"

    if [ -n "$hits" ]; then
      echo "$hits" | tee -a "AUDIT-pass3-${tag}-importers.txt"
    else
      echo "(no importers found)" | tee -a "AUDIT-pass3-${tag}-importers.txt"
      echo "$f" >> "AUDIT-pass3-${tag}-unused.txt"
    fi
    echo "" >> "AUDIT-pass3-${tag}-importers.txt"
  done < "$list_file"

  {
    echo "---- SUMMARY ${tag} ----"
    echo "Total: $(wc -l < "$list_file" | tr -d ' ')"
    if [ -s "AUDIT-pass3-${tag}-unused.txt" ]; then
      echo "No-importers:"
      cat "AUDIT-pass3-${tag}-unused.txt"
    else
      echo "All have importers."
    fi
  } | tee -a "AUDIT-pass3-${tag}-importers.txt"
}

[ -s AUDIT-pass3-hooks-all.txt ]    && check_batch AUDIT-pass3-hooks-all.txt hooks
[ -s AUDIT-pass3-utils-all.txt ]    && check_batch AUDIT-pass3-utils-all.txt utils
[ -s AUDIT-pass3-services-all.txt ] && check_batch AUDIT-pass3-services-all.txt services

# 3) Combined candidates list
: > AUDIT-pass3-CANDIDATES.txt
for t in hooks utils services; do
  [ -s "AUDIT-pass3-${t}-unused.txt" ] && cat "AUDIT-pass3-${t}-unused.txt" >> AUDIT-pass3-CANDIDATES.txt
done
sort -u -o AUDIT-pass3-CANDIDATES.txt AUDIT-pass3-CANDIDATES.txt

echo "Done. Review AUDIT-pass3-*-importers.txt and AUDIT-pass3-CANDIDATES.txt"
