/*
  POST /api/sync-chess-ratings

  Triggered by a monthly cron job (or manually).
  Requires a Bearer token matching CRON_SECRET in .env.local.

  Steps:
  1. Validate Bearer token
  2. Scrape Israeli ratings from chess.org.il
  3. Download FIDE ratings
  4. Sync matched players to Firestore
  5. Return a summary
*/

import { NextResponse } from "next/server";
import { scrapeIsraeliRatings, fetchFideRatings, syncRatingsToFirestore } from "@/lib/chessSync";

export async function POST(request: Request) {
  // Validate the secret token so only our cron job can trigger this
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch data from both sources in parallel
    const [israeliData, fideData] = await Promise.all([
      scrapeIsraeliRatings(),
      fetchFideRatings(),
    ]);

    // Write matching updates to Firestore
    const summary = await syncRatingsToFirestore(israeliData, fideData);

    return NextResponse.json({
      ...summary,
      israeliPlayersFound: israeliData.length,
      fidePlayersFound: fideData.size,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Chess sync failed:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
