import Anthropic from "@anthropic-ai/sdk";
import { liveAllowed } from "@/lib/access";
import { loadSecrets } from "@/lib/secrets";
import { forward, remoteSite } from "@/lib/remote";
import { liveSearch, type SearchProfile } from "@/lib/search/run";
import type { PortalResult, Posting } from "@/lib/search/types";

// Rates postings that the person's own computer found (the local search helper): drops
// duplicates and jobs already seen, then Claude rates the closest ones, as in the chat's search.
// Everything in the request is untrusted, so it's checked and trimmed here.

export const maxDuration = 120;

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.slice(0, max) : "");
const strings = (v: unknown, max: number, len = 120) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, len)).slice(0, max) : [];

function cleanPosting(raw: unknown): Posting | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const id = str(p.id, 120);
  const title = str(p.title);
  if (!/^(jb|li|az|jo)-/.test(id) || !title) return null;
  const url = str(p.url, 600);
  return {
    id,
    title,
    company: str(p.company),
    location: str(p.location),
    portal: str(p.portal, 60),
    via: str(p.via, 60) || undefined,
    posted: /^\d{4}-\d{2}-\d{2}$/.test(str(p.posted, 10)) ? str(p.posted, 10) : "",
    url: /^https:\/\//.test(url) ? url : "",
    salary: str(p.salary, 120) || undefined,
    snippet: str(p.snippet, 600) || undefined,
  };
}

function cleanResults(raw: unknown): PortalResult[] {
  if (!Array.isArray(raw)) return [];
  let budget = 400;
  return raw.slice(0, 6).flatMap((r) => {
    if (!r || typeof r !== "object") return [];
    const o = r as Record<string, unknown>;
    const status = o.status === "ok" || o.status === "failed" || o.status === "not_connected" ? o.status : "failed";
    const postings = (Array.isArray(o.postings) ? o.postings : [])
      .slice(0, Math.max(0, budget))
      .flatMap((p) => cleanPosting(p) ?? []);
    budget -= postings.length;
    return [{ name: str(o.name, 60) || "Job site", status, postings }];
  });
}

export async function POST(request: Request) {
  await loadSecrets();
  // Connected local app: Claude runs on the shared site.
  const remote = remoteSite();
  if (remote) return forward(remote, "/api/search", { method: "POST", body: await request.text() });
  const access = await liveAllowed(request);
  if (!access.ok)
    return Response.json(
      { message: access.message, code: access.status === 401 ? "auth" : undefined },
      { status: access.status },
    );
  const raw = await request.text();
  if (raw.length > 1_000_000) return Response.json({ message: "That search is too large." }, { status: 413 });
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return Response.json({ message: "Bad request." }, { status: 400 });
  }
  const results = cleanResults(body.results);
  if (!results.length) return Response.json({ message: "No search results to rate." }, { status: 400 });
  try {
    const search = await liveSearch({
      roles: strings(body.roles, 2, 80),
      cities: strings(body.cities, 2, 80),
      profile: (body.profile ?? {}) as SearchProfile,
      seen: strings(body.seen, 3000),
      provided: results,
    });
    return Response.json({ search });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json({ message: "The API key was rejected.", code: "auth" }, { status: 401 });
    }
    return Response.json({ message: "Something went wrong while rating the postings. Try again." }, { status: 502 });
  }
}
