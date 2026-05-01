/*
  NEXT.JS MIDDLEWARE — runs on every request before the page loads.

  Auth is not yet implemented, so all routes are open.
  When login is added back:
  - Store a "session" cookie after successful Firebase sign-in
  - Uncomment the cookie check below to redirect unauthenticated users to /login

  This is NOT a security boundary — Firebase security rules protect the data.
  Middleware is only for UX (preventing blank flash before client redirect).
*/

import { NextRequest, NextResponse } from "next/server";

export function middleware(_request: NextRequest) {
  // Auth bypass — login not yet implemented
  return NextResponse.next();

  /* ── Enable this block when login is ready ──
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  const session = request.cookies.get("session");
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
  */
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
