// The local search helper: the person's own copy of the app (npx next start -p 3124) runs job
// searches from their home internet for the shared Vercel site, which can't reach LinkedIn from
// its servers. Only the sites listed here may call it; it never runs on Vercel. Server-only.

const DEFAULT_ORIGINS = ["https://ai-job-search-phi.vercel.app"];

function allowedOrigins() {
  const extra = (process.env.LOCAL_HELPER_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return [...DEFAULT_ORIGINS, ...extra];
}

/** CORS headers for an allowed origin, or null when the caller isn't allowed. */
export function helperHeaders(request: Request): Record<string, string> | null {
  const origin = request.headers.get("origin");
  // Same-origin calls (no Origin header) come from the local site itself.
  if (!origin) return {};
  if (!allowedOrigins().includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    // Chrome asks before a public site talks to this computer; this header says the helper agrees.
    "Access-Control-Allow-Private-Network": "true",
    Vary: "Origin",
  };
}

export function helperDisabled() {
  return !!process.env.VERCEL;
}

export function helperPreflight(request: Request) {
  if (helperDisabled()) return new Response(null, { status: 404 });
  const h = helperHeaders(request);
  return h ? new Response(null, { status: 204, headers: h }) : new Response(null, { status: 403 });
}
