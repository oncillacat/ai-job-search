#!/bin/bash
# Builds the Windows installer "AI-Job-Search-Setup-<version>-x64.exe" (needs NSIS: brew install makensis).
#
#   scripts/build-windows.sh /path/to/node-vXX-win-x64   [output dir, default ../dist]
#
# The first argument is the unpacked official Node.js build for win-x64 (nodejs.org/dist); its
# node.exe is carried by the app so people don't need Node installed.
set -euo pipefail

NODE_DIR="${1:?Pass the unpacked Node.js win-x64 folder}"
WEB="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${2:-$WEB/../dist}"
VERSION="$(node -p "require('$WEB/package.json').version")"
[ -f "$NODE_DIR/node.exe" ] || { echo "No node.exe in $NODE_DIR"; exit 1; }
command -v makensis >/dev/null || { echo "NSIS is needed: brew install makensis"; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
STAGE="$WORK/stage"

echo "1/3 Build the server (clean copy, self-contained)"
"$WEB/scripts/build-standalone.sh" "$STAGE/app"

echo "2/3 Assemble"
mkdir -p "$STAGE/node"
cp "$NODE_DIR/node.exe" "$STAGE/node/node.exe"
cp "$NODE_DIR/LICENSE" "$STAGE/node/LICENSE"
cp "$WEB/scripts/windows-launcher.ps1" "$STAGE/launcher.ps1"
cp "$WEB/scripts/AppIcon.ico" "$STAGE/AppIcon.ico"
# Windows PowerShell 5.1 reads scripts without a BOM as the old ANSI code page; add one so any
# non-ASCII text survives.
printf '\xEF\xBB\xBF' | cat - "$STAGE/launcher.ps1" > "$STAGE/launcher.tmp" && mv "$STAGE/launcher.tmp" "$STAGE/launcher.ps1"

echo "3/3 Installer"
mkdir -p "$OUT"
EXE="$(cd "$OUT" && pwd)/AI-Job-Search-Setup-$VERSION-x64.exe"
# NSIS crashes ("bad_alloc") when no UTF-8 locale is set, as in some shells.
LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 makensis -V2 -DVERSION="$VERSION" -DSTAGE="$STAGE" -DOUTFILE="$EXE" "$WEB/scripts/windows-installer.nsi"
echo "Done: $EXE ($(du -h "$EXE" | cut -f1))"
