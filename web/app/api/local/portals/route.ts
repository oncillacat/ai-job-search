import { helperDisabled, helperHeaders, helperPreflight } from "@/lib/local-helper-cors";
import { loadSecrets } from "@/lib/secrets";
import { searchAdzuna, searchJobBank, searchJooble, searchLinkedIn } from "@/lib/search/portals";

// Local search helper: searches the job sites from this computer and returns the raw postings.
// No Claude here; the shared site rates them. See lib/local-helper-cors.ts.

export const maxDuration = 120;

export function OPTIONS(request: Request) {
  return helperPreflight(request);
}

/** Lets the shared site check that the helper is running. */
export function GET(request: Request) {
  if (helperDisabled()) return new Response(null, { status: 404 });
  const h = helperHeaders(request);
  if (!h) return new Response(null, { status: 403 });
  return Response.json({ helper: true }, { headers: h });
}

const strings = (v: unknown, max: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 80)).slice(0, max) : [];

export async function POST(request: Request) {
  await loadSecrets(); // Adzuna and Jooble keys
  if (helperDisabled()) return new Response(null, { status: 404 });
  const h = helperHeaders(request);
  if (!h) return new Response(null, { status: 403 });
  const body = (await request.json().catch(() => null)) as { roles?: unknown; cities?: unknown } | null;
  const roles = strings(body?.roles, 2);
  const cities = strings(body?.cities, 2);
  if (!roles.length) return Response.json({ message: "No roles to search for." }, { status: 400, headers: h });
  const q = { roles, cities, days: 14 };
  const results = await Promise.all([searchJobBank(q), searchLinkedIn(q), searchAdzuna(q), searchJooble(q)]);
  return Response.json({ results }, { headers: h });
}
