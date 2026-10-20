#!/bin/bash
# Builds the app as a self-contained server (Next.js "standalone") from a clean copy of the code,
# for the Mac and Windows apps. No .env files are copied, so no API key can end up inside.
#
#   scripts/build-standalone.sh <output dir>     (the dir gets server.js, .next/, public/, node_modules/)
set -euo pipefail

OUT="${1:?Pass an output folder}"
WEB="$(cd "$(dirname "$0")/.." && pwd)"
SHARED_SITE="https://ai-job-search-phi.vercel.app"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

rsync -a --exclude node_modules --exclude .next --exclude '.env*' --exclude .vercel \
  --exclude tsconfig.tsbuildinfo --exclude scripts "$WEB/" "$WORK/src/"
cd "$WORK/src"
# Nothing from this shell's Claude settings may reach the build.
for v in $(env | grep -oE '^ANTHROPIC_[A-Z_]+'); do unset "$v"; done
npm ci --no-audit --no-fund >/dev/null 2>&1
# REMOTE_* here only tell the pages that Claude is available (no sample person); the real access
# code is entered on each computer. This placeholder is never used to call anything.
BUILD_STANDALONE=1 REMOTE_SITE="$SHARED_SITE" REMOTE_ACCESS_CODE="set-on-each-computer" npm run build >/dev/null
rm -rf "$OUT" && mkdir -p "$(dirname "$OUT")"
cp -R .next/standalone "$OUT"
cp -R .next/static "$OUT/.next/static"
cp -R public "$OUT/public"
# The image library is never used (no next/image) and is built for this Mac only: leave it out.
rm -rf "$OUT/node_modules/@img" "$OUT/node_modules/sharp"

if grep -rIlE "sk-ant-[a-z0-9]+-[A-Za-z0-9_-]{30,}" "$OUT" >/dev/null 2>&1; then
  echo "An API key was found in the build. Stopping."; rm -rf "$OUT"; exit 1
fi
