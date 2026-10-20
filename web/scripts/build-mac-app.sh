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
APP_NAME="AI Job Search"
VERSION="$(node -p "require('$WEB/package.json').version")"

[ -x "$NODE_DIR/bin/node" ] || { echo "No node binary in $NODE_DIR/bin"; exit 1; }
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "1/4 Build the server (clean copy, self-contained)"
"$WEB/scripts/build-standalone.sh" "$WORK/standalone"
STANDALONE="$WORK/standalone"

echo "2/4 Assemble the app"
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

# Ad-hoc signature (Apple Silicon needs code to be signed; this isn't a Developer ID).
codesign --force --deep --sign - "$APP" >/dev/null

echo "3/4 Disk image"
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

echo "4/4 Done: $DMG ($(du -h "$DMG" | cut -f1))"
