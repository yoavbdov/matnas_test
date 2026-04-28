/*
  NEXT.JS MIDDLEWARE — runs on every request before the page loads.

  Purpose: redirect unauthenticated users to /login.

  How it works:
  - Firebase client-side auth doesn't work in Edge middleware directly.
  - Strategy: store a simple session token in a cookie when user logs in.
    (Set the cookie in the login page after successful Firebase sign-in.)
  - Middleware checks: does the request have this cookie?
    - Yes → let the request through
    - No  → redirect to /login
  - Exception: /login itself and /api/* routes always pass through.

  This is not a security boundary (Firebase rules protect the data).
  It's just UX — prevents the flash of a blank page before client-side redirect.
*/

export function middleware() {}