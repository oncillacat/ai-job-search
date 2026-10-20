#!/bin/bash
# Starts AI Job Search on this computer and opens it in the browser. Double-click this file
# (macOS opens it in Terminal). Searches, LinkedIn included, run from this computer; Claude works
# through the shared site with its owner's key, using your access code. Keep the window open while
# you use the app; close it, or press Ctrl+C, to stop.

SHARED_SITE="https://ai-job-search-phi.vercel.app"
PORT=3124
URL="http://localhost:$PORT/chat"

# The app folder is the one above this script, wherever the script is opened from.
SCRIPT="$0"
[ -L "$SCRIPT" ] && SCRIPT="$(readlink "$SCRIPT")"
cd "$(dirname "$SCRIPT")/.." || { echo "Couldn't find the app folder."; read -r -n1; exit 1; }

pause() { read -r -n1 -p "Press any key to close."; echo; }
echo "AI Job Search"
echo

if curl -s -o /dev/null -m 2 "http://localhost:$PORT/api/chat"; then
  echo "It's already running. Opening it in your browser."
  open "$URL"
  sleep 1
  exit 0
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js is needed. Install it from https://nodejs.org, then double-click this again."
  pause; exit 1
fi

# First run: no API key of your own and no access code yet. Ask for the code once.
[ -f .env.local ] || : > .env.local
chmod 600 .env.local
if ! grep -qE '^(ANTHROPIC_API_KEY|REMOTE_ACCESS_CODE)=.+' .env.local; then
  echo "Enter the access code you were given (it isn't shown as you type):"
  read -r -s CODE; echo
  if [ -z "$CODE" ]; then echo "No code entered."; pause; exit 1; fi
  {
    echo "REMOTE_SITE=$SHARED_SITE"
    printf 'REMOTE_ACCESS_CODE=%s\n' "$CODE"
  } >> .env.local
  echo "Saved. You won't be asked again on this computer."
  echo
fi

if [ ! -d node_modules ]; then
  echo "First run: installing (a minute or two)..."
  npm install || { echo "Install failed."; pause; exit 1; }
fi

# Build when there's no build yet, or the code or settings changed since the last one.
if [ ! -f .next/BUILD_ID ] || [ -n "$(find app components lib proxy.ts next.config.ts .env.local -newer .next/BUILD_ID -print -quit 2>/dev/null)" ]; then
  echo "Preparing the app (about a minute)..."
  npm run build >/dev/null || { echo "Build failed."; pause; exit 1; }
fi

# Only this computer can reach it (not others on the same Wi-Fi).
npx next start -p "$PORT" -H 127.0.0.1 &
APP=$!
trap 'kill $APP 2>/dev/null' EXIT INT TERM

for _ in $(seq 1 30); do
  curl -s -o /dev/null -m 1 "http://localhost:$PORT/api/chat" && break
  sleep 1
done
open "$URL"
echo
echo "Running at $URL. Keep this window open while you use it."
echo "To stop: close this window or press Ctrl+C."
wait $APP
