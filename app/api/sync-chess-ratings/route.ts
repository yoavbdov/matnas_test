/*

  ----------------------------------------------------------------------------------------------------------
  This is the file where we can run backend serverless functions, like sync chess players rating every month
  ----------------------------------------------------------------------------------------------------------
  API ROUTE: POST /api/sync-chess-ratings
  This is the server-side endpoint that runs the monthly chess rating sync.

  Who calls it:
  - A Vercel Cron Job, configured to fire once a month at night (e.g. 02:00 on the 1st)
  - Config in vercel.json: { "crons": [{ "path": "/api/sync-chess-ratings", "schedule": "0 2 1 * *" }] }

  Security:
  - Request must include a secret header: Authorization: Bearer CRON_SECRET
  - CRON_SECRET is an environment variable set in Vercel dashboard
  - If secret doesn't match → return 401(unautorized) immediately

  What it does:
  1. Call scrapeIsraeliRatings() from chessSync.ts → get all ~6800 players
  2. Call fetchFideRatings() from chessSync.ts → get FIDE data
  3. Call syncRatingsToFirestore(israeliData, fideData)
  4. Return JSON response: { updated, skipped, errors[], timestamp }

  If anything throws: return 500 with the error message.
  The Vercel dashboard shows cron run history so we can see if it succeeded.
*/
