import { execFile } from "node:child_process";

// Keys for the app on the person's own computer, kept in the macOS Keychain (service
// "AI Job Search"). The running server reads them into process.env, so a key saved in Settings
// works at once; the Mac app's launcher loads them again at start. Never used on Vercel.
// Server-only.

export const SECRET_NAMES = [
  "ANTHROPIC_API_KEY",
  "REMOTE_ACCESS_CODE",
  "ADZUNA_APP_ID",
  "ADZUNA_APP_KEY",
  "JOOBLE_API_KEY",
] as const;
export type SecretName = (typeof SECRET_NAMES)[number];

const SERVICE = "AI Job Search";

export function secretsSupported() {
  return !process.env.VERCEL && process.platform === "darwin";
}

function security(args: string[]) {
  return new Promise<{ ok: boolean; out: string }>((resolve) => {
    execFile("/usr/bin/security", args, { timeout: 10_000 }, (err, stdout) =>
      resolve({ ok: !err, out: String(stdout ?? "").trim() }),
    );
  });
}

export async function readSecret(name: SecretName) {
  const r = await security(["find-generic-password", "-s", SERVICE, "-a", name, "-w"]);
  return r.ok && r.out ? r.out : null;
}

export async function saveSecret(name: SecretName, value: string) {
  // -U updates the item when it already exists.
  const r = await security(["add-generic-password", "-U", "-s", SERVICE, "-a", name, "-w", value]);
  if (r.ok) process.env[name] = value;
  return r.ok;
}

export async function deleteSecret(name: SecretName) {
  await security(["delete-generic-password", "-s", SERVICE, "-a", name]);
  delete process.env[name];
}

/** Loads saved keys into this server, without replacing ones already set in its environment. */
let loaded: Promise<void> | null = null;
export function loadSecrets() {
  if (!secretsSupported()) return Promise.resolve();
  loaded ??= (async () => {
    for (const name of SECRET_NAMES) {
      if (process.env[name]) continue;
      const v = await readSecret(name);
      if (v) process.env[name] = v;
    }
    if (process.env.REMOTE_ACCESS_CODE && !process.env.REMOTE_SITE) {
      process.env.REMOTE_SITE = "https://ai-job-search-phi.vercel.app";
    }
  })();
  return loaded;
}
