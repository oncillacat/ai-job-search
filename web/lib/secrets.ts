import { execFile } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

// Keys for the app on the person's own computer. On a Mac they're in the Keychain (service
// "AI Job Search"); on Windows, each is a file encrypted with Windows Data Protection for the
// current user (%APPDATA%\AI Job Search\keys\<NAME>.dat), the same format the Windows
// launcher writes. The running server reads them into process.env, so a key saved in Settings
// works at once. Never used on Vercel. Server-only.

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
  return !process.env.VERCEL && (process.platform === "darwin" || process.platform === "win32");
}

const isWindows = () => process.platform === "win32";

function keyFile(name: SecretName) {
  return join(process.env.APPDATA ?? "", SERVICE, "keys", `${name}.dat`);
}

/** Runs a short PowerShell script; secrets go in on stdin and out on stdout, never on the command line. */
function powershell(script: string, input: string, file: string) {
  return new Promise<{ ok: boolean; out: string }>((resolve) => {
    const child = execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
      { timeout: 15_000, env: { ...process.env, AJS_FILE: file }, windowsHide: true },
      (err, stdout) => resolve({ ok: !err, out: String(stdout ?? "").trim() }),
    );
    child.stdin?.end(input);
  });
}

const PS_PROTECT =
  "Add-Type -AssemblyName System.Security; $v=[Console]::In.ReadToEnd(); " +
  "$p=[Security.Cryptography.ProtectedData]::Protect([Text.Encoding]::UTF8.GetBytes($v),$null,'CurrentUser'); " +
  "[IO.File]::WriteAllText($env:AJS_FILE,[Convert]::ToBase64String($p))";
const PS_UNPROTECT =
  "Add-Type -AssemblyName System.Security; if (Test-Path -LiteralPath $env:AJS_FILE) { " +
  "$b=[Convert]::FromBase64String([IO.File]::ReadAllText($env:AJS_FILE)); " +
  "[Console]::Out.Write([Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect($b,$null,'CurrentUser'))) }";

function security(args: string[]) {
  return new Promise<{ ok: boolean; out: string }>((resolve) => {
    execFile("/usr/bin/security", args, { timeout: 10_000 }, (err, stdout) =>
      resolve({ ok: !err, out: String(stdout ?? "").trim() }),
    );
  });
}

export async function readSecret(name: SecretName) {
  if (isWindows()) {
    const w = await powershell(PS_UNPROTECT, "", keyFile(name));
    return w.ok && w.out ? w.out : null;
  }
  const r = await security(["find-generic-password", "-s", SERVICE, "-a", name, "-w"]);
  return r.ok && r.out ? r.out : null;
}

export async function saveSecret(name: SecretName, value: string) {
  if (isWindows()) {
    await mkdir(join(process.env.APPDATA ?? "", SERVICE, "keys"), { recursive: true });
    const w = await powershell(PS_PROTECT, value, keyFile(name));
    if (w.ok) process.env[name] = value;
    return w.ok;
  }
  // -U updates the item when it already exists.
  const r = await security(["add-generic-password", "-U", "-s", SERVICE, "-a", name, "-w", value]);
  if (r.ok) process.env[name] = value;
  return r.ok;
}

export async function deleteSecret(name: SecretName) {
  if (isWindows()) await rm(keyFile(name), { force: true });
  else await security(["delete-generic-password", "-s", SERVICE, "-a", name]);
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
