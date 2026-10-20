"use client";

import type { LiveSearch, PortalResult } from "@/lib/search/types";

// Searching from this computer. Browsers block a public site from calling apps on the visitor's
// own computer, so instead the person runs the app locally (port 3124): its server searches the
// job sites from their home internet, and, when connected to the shared site (lib/remote.ts),
// Claude rates and tailors there with the owner's key.

export function onSharedSite() {
  return typeof window !== "undefined" && !["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

/** The app on this computer: search the job sites here, then have Claude rate the postings. */
export async function searchFromThisComputer(input: {
  roles: string[];
  cities: string[];
  profile: unknown;
  seen: string[];
}): Promise<LiveSearch> {
  const local = await fetch("/api/local/portals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roles: input.roles, cities: input.cities }),
    signal: AbortSignal.timeout(110_000),
  }).catch(() => null);
  if (!local?.ok) throw new Error("The search on this computer didn't finish. Check your internet connection and try again.");
  const { results } = (await local.json()) as { results: PortalResult[] };

  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, results }),
  });
  const out = (await res.json().catch(() => ({}))) as { search?: LiveSearch; message?: string; code?: string };
  if (!res.ok || !out.search) {
    throw Object.assign(new Error(out.message ?? "I couldn't rate the postings. Try again."), {
      code: res.status === 401 || out.code === "auth" ? "auth" : undefined,
    });
  }
  return out.search;
}
