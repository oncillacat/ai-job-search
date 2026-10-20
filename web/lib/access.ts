// Who may use the Claude-powered features. Server-only.
//
// - Local (not on Vercel): always, as before.
// - On Vercel: only when APP_PASSCODE is set and the visitor entered it (a signed cookie),
//   or when ALLOW_PUBLIC_CHAT is set (open to anyone; not recommended).
// Until real sign-in exists (docs/plan-chat-first.md), the passcode keeps strangers and bots
// from spending the owner's Claude credit.

export const ACCESS_COOKIE = "ajs_access";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const onVercel = () => !!process.env.VERCEL;
const hasKey = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

/** The site uses a passcode (on Vercel, with APP_PASSCODE set and no public override). */
export function passcodeRequired() {
  return onVercel() && !process.env.ALLOW_PUBLIC_CHAT && !!process.env.APP_PASSCODE;
}

/** Claude features can run on this deployment at all (key present; on Vercel, gated or opened). */
export function liveConfigured() {
  // A local app connected to the shared site (see lib/remote.ts) uses Claude through it.
  if (!onVercel() && !hasKey() && process.env.REMOTE_SITE && process.env.REMOTE_ACCESS_CODE) return true;
  if (!hasKey()) return false;
  if (!onVercel()) return true;
  return !!process.env.ALLOW_PUBLIC_CHAT || !!process.env.APP_PASSCODE;
}

async function hmac(value: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(process.env.APP_PASSCODE ?? ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The cookie value proving the visitor entered the passcode. Changes when the passcode changes. */
export function accessToken() {
  return hmac("ajs-access-v1");
}

function sameString(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function passcodeMatches(attempt: string) {
  const code = process.env.APP_PASSCODE;
  if (!code) return false;
  // Compare digests so the comparison takes the same time whatever was typed.
  return sameString(await hmac(`try:${attempt}`), await hmac(`try:${code}`));
}

export async function hasAccessCookie(cookieValue: string | undefined) {
  return !!cookieValue && sameString(cookieValue, await accessToken());
}

/** For route handlers: may this request use Claude? Returns a reason when not. */
export async function liveAllowed(request: Request): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (!hasKey()) {
    return {
      ok: false,
      status: 503,
      message: onVercel()
        ? "Claude isn't set up on this site yet."
        : "Add your Anthropic API key or access code in Settings → Keys and access.",
    };
  }
  if (!onVercel() || process.env.ALLOW_PUBLIC_CHAT) return { ok: true };
  if (!process.env.APP_PASSCODE) {
    return { ok: false, status: 503, message: "Live features are off on the public demo until sign-in exists." };
  }
  // A connected local app sends the code itself (server to server).
  const sent = request.headers.get("x-access-code");
  if (sent) {
    if (await passcodeMatches(sent)) return { ok: true };
    await new Promise((r) => setTimeout(r, 800));
    return { ok: false, status: 401, message: "The access code in your app's settings doesn't match." };
  }
  const cookie = request.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${ACCESS_COOKIE}=`))
    ?.slice(ACCESS_COOKIE.length + 1);
  if (await hasAccessCookie(cookie)) return { ok: true };
  return { ok: false, status: 401, message: "Enter the access code to use this site." };
}
