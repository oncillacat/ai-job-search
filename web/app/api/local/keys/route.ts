import { deleteSecret, loadSecrets, saveSecret, SECRET_NAMES, secretsSupported, type SecretName } from "@/lib/secrets";

// Settings → Keys and access, for the app on the person's own computer. Saves keys in the macOS
// Keychain and never sends a saved key back: only whether it's set and its last 4 characters.
// Only the app itself may call this: same origin, on this computer's own address.

function allowed(request: Request) {
  if (!secretsSupported()) return false;
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? "";
  // A page served from another name pointing here (DNS rebinding) must not reach this.
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return false;
  const origin = request.headers.get("origin");
  return !origin || origin === `${url.protocol}//${host}`;
}

const isName = (v: unknown): v is SecretName => SECRET_NAMES.includes(v as SecretName);

export async function GET(request: Request) {
  if (!allowed(request)) return new Response(null, { status: 404 });
  await loadSecrets();
  const keys = Object.fromEntries(
    SECRET_NAMES.map((n) => {
      const v = process.env[n];
      return [n, v ? { set: true, hint: v.length > 8 ? `…${v.slice(-4)}` : "set" } : { set: false }];
    }),
  );
  return Response.json({
    keys,
    remoteSite: process.env.REMOTE_SITE ?? null,
    store: process.platform === "win32" ? "windows" : "keychain",
  });
}

export async function POST(request: Request) {
  if (!allowed(request)) return new Response(null, { status: 404 });
  if (!request.headers.get("content-type")?.includes("application/json")) return new Response(null, { status: 415 });
  const body = (await request.json().catch(() => null)) as { name?: unknown; value?: unknown } | null;
  if (!body || !isName(body.name)) return Response.json({ message: "Unknown key." }, { status: 400 });
  const value = typeof body.value === "string" ? body.value.trim() : "";
  if (!value || value.length > 400 || /\s/.test(value)) {
    return Response.json({ message: "That doesn't look like a key. Paste it without spaces." }, { status: 400 });
  }
  if (body.name === "ANTHROPIC_API_KEY" && !value.startsWith("sk-ant-")) {
    return Response.json({ message: "Anthropic API keys start with sk-ant-." }, { status: 400 });
  }
  if (!(await saveSecret(body.name, value))) {
    return Response.json({ message: "Couldn't save it on this computer." }, { status: 500 });
  }
  if (body.name === "REMOTE_ACCESS_CODE" && !process.env.REMOTE_SITE) {
    process.env.REMOTE_SITE = "https://ai-job-search-phi.vercel.app";
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!allowed(request)) return new Response(null, { status: 404 });
  const name = new URL(request.url).searchParams.get("name");
  if (!isName(name)) return Response.json({ message: "Unknown key." }, { status: 400 });
  await deleteSecret(name);
  return Response.json({ ok: true });
}
