#!/bin/bash
# Builds "AI Job Search.app" and a DMG for Apple Silicon Macs.
#
#   scripts/build-mac-app.sh /path/to/node-vXX-darwin-arm64   [output dir, default ../dist]
#
# The first argument is an unpacked official Node.js build for darwin-arm64 (nodejs.org/dist),
# which the app carries so people don't need Node installed. The app is built from a clean copy
# of the code: no .env files, so no API key can end up inside it. Keys and the access code are
# entered on the person's Mac and kept in their Keychain (lib/secrets.ts).
set -euo pipefail

NODE_DIR="${1:?Pass the unpacked Node.js darwin-arm64 folder}"
WEB="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${2:-$WEB/../dist}"
SHARED_SITE="https://ai-job-search-phi.vercel.app"
APP_NAME="AI Job Search"
VERSION="$(node -p "require('$WEB/package.json').version")"

[ -x "$NODE_DIR/bin/node" ] || { echo "No node binary in $NODE_DIR/bin"; exit 1; }
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "1/5 Clean copy of the code"
rsync -a --exclude node_modules --exclude .next --exclude '.env*' --exclude .vercel \
  --exclude tsconfig.tsbuildinfo --exclude scripts "$WEB/" "$WORK/src/"

echo "2/5 Install and build (self-contained server)"
cd "$WORK/src"
# Nothing from this shell's Claude settings may reach the build.
for v in $(env | grep -oE '^ANTHROPIC_[A-Z_]+'); do unset "$v"; done
npm ci --no-audit --no-fund >/dev/null
# REMOTE_* here only tell the pages that Claude is available (no sample person); the real access
# code is entered on each Mac. This placeholder is never used to call anything.
BUILD_STANDALONE=1 REMOTE_SITE="$SHARED_SITE" REMOTE_ACCESS_CODE="set-on-each-mac" npm run build >/dev/null
STANDALONE="$WORK/src/.next/standalone"
cp -R .next/static "$STANDALONE/.next/static"
cp -R public "$STANDALONE/public"

echo "3/5 Assemble the app"
APP="$WORK/$APP_NAME.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp -R "$STANDALONE" "$APP/Contents/Resources/app"
mkdir -p "$APP/Contents/Resources/node/bin"
cp "$NODE_DIR/bin/node" "$APP/Contents/Resources/node/bin/node"
cp "$NODE_DIR/LICENSE" "$APP/Contents/Resources/node/LICENSE"
cp "$WEB/scripts/mac-launcher.sh" "$APP/Contents/MacOS/$APP_NAME"
chmod +x "$APP/Contents/MacOS/$APP_NAME"
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>$APP_NAME</string>
  <key>CFBundleDisplayName</key><string>$APP_NAME</string>
  <key>CFBundleIdentifier</key><string>app.aijobsearch.local</string>
  <key>CFBundleExecutable</key><string>$APP_NAME</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>LSMinimumSystemVersion</key><string>12.0</string>
  <key>LSArchitecturePriority</key><array><string>arm64</string></array>
  <key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
[ -f "$WEB/scripts/AppIcon.icns" ] && cp "$WEB/scripts/AppIcon.icns" "$APP/Contents/Resources/AppIcon.icns" && \
  /usr/libexec/PlistBuddy -c "Add :CFBundleIconFile string AppIcon" "$APP/Contents/Info.plist"

# Check no key slipped in (a real key: the prefix, its type, then a long secret).
if grep -rIlE "sk-ant-[a-z0-9]+-[A-Za-z0-9_-]{30,}" "$APP" >/dev/null 2>&1; then
  echo "An API key was found inside the app. Stopping."; exit 1
fi
# Ad-hoc signature (Apple Silicon needs code to be signed; this isn't a Developer ID).
codesign --force --deep --sign - "$APP" >/dev/null

echo "4/5 Disk image"
DMG_DIR="$WORK/dmg"
mkdir -p "$DMG_DIR"
mv "$APP" "$DMG_DIR/"
ln -s /Applications "$DMG_DIR/Applications"
cat > "$DMG_DIR/Read me first.txt" <<'TXT'
AI Job Search

1. Drag "AI Job Search" into the Applications folder.
2. Open it from Applications. The first time, macOS may say it can't check the app (it isn't
   from the App Store). Open System Settings > Privacy & Security, scroll down, and click
   "Open Anyway" next to AI Job Search. You only do this once.
3. Enter the access code you were given, or your own Anthropic API key. It's saved in your
   Mac's Keychain. You can change it later in the app under Settings > Keys and access.
4. The app opens in your web browser. Keep the small "AI Job Search is running" window open
   while you use it; click Quit there to stop.

Job searches, LinkedIn included, run from your own computer. Your CV and documents stay in
your browser on this Mac.
TXT
mkdir -p "$OUT"
DMG="$OUT/AI-Job-Search-$VERSION-arm64.dmg"
rm -f "$DMG"
hdiutil create -volname "$APP_NAME" -srcfolder "$DMG_DIR" -ov -format UDZO "$DMG" >/dev/null

echo "5/5 Done: $DMG ($(du -h "$DMG" | cut -f1))"
