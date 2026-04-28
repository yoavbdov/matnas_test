/*
  LOGIN PAGE — the only page visible without being logged in.

  Layout (RTL, Hebrew):
  - App logo/name centered
  - Email input (maxLength 254)
  - Password input (maxLength 128) with a show/hide toggle
  - "התחברות" button
  - Error message shown inline in Hebrew when login fails

  Behavior:
  - On submit: call Firebase signInWithEmailAndPassword
  - On success: redirect to /dashboard
  - On failure: show Hebrew error message (wrong password, no account, etc.)
  - If already logged in when landing here: redirect to /dashboard immediately

  No sign-up. Accounts are created manually by the admin in Firebase console.
*/
