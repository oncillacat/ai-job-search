"use client";

import type { LiveSearch, PortalResult } from "@/lib/search/types";

// The local search helper, seen from the shared site: when the person's own copy of the app runs
// on this computer (npx next start -p 3124), job sites are searched from their home internet,
// which LinkedIn accepts, and the shared site's Claude rates the results. Not used when the page
// itself is the local app.

const HELPER = "http://localhost:3124";

let found: Promise<boolean> | null = null;

function onSharedSite() {
  return typeof window !== "undefined" && !["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

/** Is the helper running? Checked once per page, quickly. */
export function helperAvailable(): Promise<boolean> {
  if (!onSharedSite()) return Promise.resolve(false);
  found ??= fetch(`${HELPER}/api/local/portals`, { signal: AbortSignal.timeout(1500) })
    .then((r) => r.ok)
    .catch(() => false);
  return found;
}

/** Searches from this computer, then has the shared site rate the postings. */
export async function searchFromThisComputer(input: {
  roles: string[];
  cities: string[];
  profile: unknown;
  seen: string[];
}): Promise<LiveSearch> {
  const local = await fetch(`${HELPER}/api/local/portals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roles: input.roles, cities: input.cities }),
    signal: AbortSignal.timeout(110_000),
  }).catch(() => null);
  if (!local?.ok) throw new Error("Your computer's search helper didn't answer. Check that the local app is running, then try again.");
  const { results } = (await local.json()) as { results: PortalResult[] };

  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, results }),
  });
  const out = (await res.json().catch(() => ({}))) as { search?: LiveSearch; message?: string };
  if (!res.ok || !out.search) throw new Error(out.message ?? "I couldn't rate the postings. Try again.");
  return out.search;
}

/** A posting's full text, read from this computer, or null when the helper isn't running. */
export async function detailFromThisComputer(posting: { id: string; snippet?: string }) {
  if (!(await helperAvailable())) return null;
  const res = await fetch(`${HELPER}/api/local/detail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: posting.id, snippet: posting.snippet }),
    signal: AbortSignal.timeout(60_000),
  }).catch(() => null);
  if (!res?.ok) return null;
  return (await res.json()) as { text: string; full: boolean; applyUrl?: string };
}
