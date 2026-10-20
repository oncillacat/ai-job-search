// "Connected" local app: someone runs the app on their own computer (so job sites, LinkedIn
// included, are searched from their home internet) without an API key of their own. Claude calls
// go server to server to the shared site, which holds the key and checks the access code.
// Set in web/.env.local: REMOTE_SITE=https://… and REMOTE_ACCESS_CODE=… Server-only.

export function remoteSite(): { url: string; code: string } | null {
  if (process.env.VERCEL) return null;
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) return null; // own key wins
  const url = process.env.REMOTE_SITE?.replace(/\/+$/, "");
  const code = process.env.REMOTE_ACCESS_CODE;
  // https only, except a shared site on this same computer (for testing).
  if (!url || !code || !/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(url)) return null;
  return { url, code };
}

/** Sends a request on to the shared site and passes its answer (streamed) straight back. */
export async function forward(
  remote: { url: string; code: string },
  path: string,
  init: { method: "GET" | "POST"; body?: string },
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${remote.url}${path}`, {
      method: init.method,
      headers: { "Content-Type": "application/json", "X-Access-Code": remote.code },
      body: init.body,
      signal: AbortSignal.timeout(300_000),
    });
  } catch {
    return Response.json(
      { message: "Couldn't reach the shared site. Check your internet connection.", live: false },
      { status: 502 },
    );
  }
  const headers = new Headers({ "Cache-Control": "no-store" });
  const type = res.headers.get("Content-Type");
  if (type) headers.set("Content-Type", type);
  return new Response(res.body, { status: res.status, headers });
}
