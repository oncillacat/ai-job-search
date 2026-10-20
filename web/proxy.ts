import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, hasAccessCookie, passcodeRequired } from "@/lib/access";

// When the site runs behind a passcode (Vercel with APP_PASSCODE), every app page and API needs
// the access cookie. The landing page, privacy page and the access page itself stay open.

const OPEN = [/^\/$/, /^\/privacy\/?$/, /^\/access\/?$/, /^\/api\/access\/?$/];

export async function proxy(request: NextRequest) {
  if (!passcodeRequired()) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  if (OPEN.some((r) => r.test(pathname))) return NextResponse.next();
  if (await hasAccessCookie(request.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Enter the access code to use this site.", live: false }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/access";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next's own files and static assets.
  matcher: ["/((?!_next/|fonts/|favicon.ico|.*\\.(?:png|svg|jpg|ico|ttf|woff2?)$).*)"],
};
