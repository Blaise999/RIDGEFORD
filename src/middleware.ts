import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware can't use Node crypto (jwt.verify) reliably on the edge without
// extra polyfills, so this is a lightweight presence check. Real verification
// happens inside the server components / API routes via getCurrentUser().
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.get("rdgf_session")?.value;

  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/kyc")) && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin-login") && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin-login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/kyc/:path*", "/admin/:path*"],
};
