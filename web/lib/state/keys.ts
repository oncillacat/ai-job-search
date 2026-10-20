"use client";

// The app on this computer: its keys in the macOS Keychain (app/api/local/keys). On the shared
// site these calls answer 404 and the key screens stay hidden.

export type KeyName = "ANTHROPIC_API_KEY" | "REMOTE_ACCESS_CODE" | "ADZUNA_APP_ID" | "ADZUNA_APP_KEY" | "JOOBLE_API_KEY";
export type KeyStatus = Record<KeyName, { set: boolean; hint?: string }>;

export async function localKeys(): Promise<{ keys: KeyStatus; remoteSite: string | null } | null> {
  const res = await fetch("/api/local/keys", { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return null;
  return res.json();
}

export async function saveKey(name: KeyName, value: string): Promise<string | null> {
  const res = await fetch("/api/local/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, value }),
  }).catch(() => null);
  if (res?.ok) return null;
  const out = (await res?.json().catch(() => null)) as { message?: string } | null;
  return out?.message ?? "Couldn't save it.";
}

export async function deleteKey(name: KeyName) {
  await fetch(`/api/local/keys?name=${name}`, { method: "DELETE" }).catch(() => null);
}
