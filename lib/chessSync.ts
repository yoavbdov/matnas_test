/*
  CHESS RATING SYNC — fetches player data from external sources and updates Firestore.
  Called by the API route /api/sync-chess-ratings (which is triggered monthly by a cron).

  This file has two responsibilities:

  ── 1. ISRAELI CHESS FEDERATION (chess.org.il) ──
  The rankings page uses ASP.NET WebForms with __VIEWSTATE (page state in a hidden field).
  To paginate we must POST back to the same URL with the updated page number.

  scrapeIsraeliRatings():
    - Fetch page 1 (GET) → parse __VIEWSTATE, __EVENTVALIDATION hidden fields
    - Parse the HTML table → extract player rows (ID, name, rating, title)
    - To go to next page: POST to same URL with the hidden fields + target page number
    - Repeat for all pages (~68 pages, 100 players each)
    - Return array of { israeli_player_id, full_name, israeli_rating, title }

  ── 2. FIDE (fide.com) ──
  FIDE publishes a monthly ratings XML/ZIP file at a known URL.

  fetchFideRatings():
    - Download the monthly FIDE ratings file (XML or CSV, ~1MB zipped)
    - Parse it into a map: { fide_id → { fide_rating, title } }
    - Return the map

  ── 3. MERGE INTO FIRESTORE ──
  syncRatingsToFirestore(israeliData, fideData):
    - Load all students from Firestore
    - For each student that has an israeli_player_id:
        → find match in israeliData → update israeli_rating
    - For each student that has a fide_player_id:
        → find match in fideData → update fide_rating, title
    - Batch-write all updates to Firestore (one batch, not one write per student)
    - Return a summary: { updated: N, skipped: N, errors: [] }
*/
