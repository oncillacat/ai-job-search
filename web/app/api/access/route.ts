import { ACCESS_COOKIE, ACCESS_MAX_AGE, accessToken, passcodeMatches } from "@/lib/access";

// Checks the access code from the /access form and sets the cookie that lets the visitor in.

/** Only same-site paths, so the form can't be used to send people elsewhere. */
function safeNext(raw: FormDataEntryValue | null) {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/chat";
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const next = safeNext(form?.get("next") ?? null);
  const code = typeof form?.get("code") === "string" ? String(form?.get("code")).trim() : "";
  const base = new URL(request.url);

  if (!code || !(await passcodeMatches(code))) {
    // A short pause makes guessing slow.
    await new Promise((r) => setTimeout(r, 800));
    const back = new URL("/access", base);
    back.searchParams.set("next", next);
    back.searchParams.set("error", "1");
    return Response.redirect(back, 303);
  }

  const res = Response.redirect(new URL(next, base), 303);
  const headers = new Headers(res.headers);
  headers.append(
    "Set-Cookie",
    `${ACCESS_COOKIE}=${await accessToken()}; Path=/; Max-Age=${ACCESS_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
  );
  return new Response(null, { status: 303, headers });
}
