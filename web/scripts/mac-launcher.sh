#!/bin/bash
# The Mac app's launcher (Contents/MacOS/AI Job Search). Starts the app's server on this Mac only,
# asks once for an access code or API key (kept in the Keychain), opens the browser, and shows a
# small window with Open and Quit.

APP="AI Job Search"
RES="$(cd "$(dirname "$0")/../Resources" && pwd)"
NODE="$RES/node/bin/node"
LOG="$HOME/Library/Logs/$APP.log"
SERVICE="AI Job Search"

dialog() { /usr/bin/osascript -e "tell me to activate" -e "$1" 2>/dev/null; }
alert() { dialog "display dialog \"$1\" buttons {\"OK\"} default button \"OK\" with title \"$APP\" with icon caution" >/dev/null; }
has_secret() { /usr/bin/security find-generic-password -s "$SERVICE" -a "$1" >/dev/null 2>&1; }
save_secret() { /usr/bin/security add-generic-password -U -s "$SERVICE" -a "$1" -w "$2" >/dev/null 2>&1; }

# Ask for "text" with hidden typing; prints the answer, or nothing if cancelled.
ask_hidden() {
  dialog "set r to display dialog \"$1\" default answer \"\" with hidden answer buttons {\"Cancel\", \"$2\"} default button \"$2\" with title \"$APP\"
return text returned of r"
}

# Already running? Just open it.
for p in $(seq 3124 3134); do
  if /usr/bin/curl -s -m 1 "http://127.0.0.1:$p/api/chat" 2>/dev/null | grep -q '"live"'; then
    /usr/bin/open "http://localhost:$p/chat"
    exit 0
  fi
done

# First run: an access code for the shared site, or the person's own Anthropic API key.
if ! has_secret ANTHROPIC_API_KEY && ! has_secret REMOTE_ACCESS_CODE; then
  CHOICE=$(dialog "set r to display dialog \"Welcome to AI Job Search.\n\nTo use Claude, enter the access code you were given, or use your own Anthropic API key.\" buttons {\"Quit\", \"Use my API key\", \"Enter access code\"} default button \"Enter access code\" with title \"$APP\"
return button returned of r")
  case "$CHOICE" in
    "Enter access code")
      CODE=$(ask_hidden "Access code:" "Save")
      [ -z "$CODE" ] && exit 0
      save_secret REMOTE_ACCESS_CODE "$CODE" || { alert "Couldn't save the code to your Keychain."; exit 1; }
      ;;
    "Use my API key")
      KEY=$(ask_hidden "Your Anthropic API key (starts with sk-ant-):" "Save")
      [ -z "$KEY" ] && exit 0
      case "$KEY" in sk-ant-*) ;; *) alert "That doesn't look like an Anthropic API key. Open the app again to retry."; exit 1 ;; esac
      save_secret ANTHROPIC_API_KEY "$KEY" || { alert "Couldn't save the key to your Keychain."; exit 1; }
      ;;
    *) exit 0 ;;
  esac
fi

# A free port, starting at 3124.
PORT=""
for p in $(seq 3124 3134); do
  if ! /usr/sbin/lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then PORT=$p; break; fi
done
[ -z "$PORT" ] && { alert "Ports 3124 to 3134 are all in use. Close something and try again."; exit 1; }
URL="http://localhost:$PORT/chat"

# Only this Mac can reach the server (127.0.0.1). Keys are read from the Keychain by the server.
cd "$RES/app" || exit 1
env -i HOME="$HOME" USER="$USER" PATH="/usr/bin:/bin:/usr/sbin:/sbin" TMPDIR="${TMPDIR:-/tmp}" \
  NODE_ENV=production PORT="$PORT" HOSTNAME=127.0.0.1 NEXT_TELEMETRY_DISABLED=1 \
  "$NODE" server.js >"$LOG" 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT

for _ in $(seq 1 40); do
  /usr/bin/curl -s -o /dev/null -m 1 "http://127.0.0.1:$PORT/api/chat" && break
  kill -0 $SERVER 2>/dev/null || { alert "AI Job Search couldn't start. Details are in ~/Library/Logs/$APP.log"; exit 1; }
  sleep 0.5
done
/usr/bin/open "$URL"

# The small window: keep it open while using the app.
while kill -0 $SERVER 2>/dev/null; do
  ANSWER=$(dialog "set r to display dialog \"AI Job Search is running.\n\nKeep this window open while you use it (you can move it aside). Click Quit when you're done.\" buttons {\"Quit\", \"Open in browser\"} default button \"Open in browser\" with title \"$APP\"
return button returned of r")
  case "$ANSWER" in
    "Open in browser") /usr/bin/open "$URL" ;;
    *) break ;;
  esac
done
