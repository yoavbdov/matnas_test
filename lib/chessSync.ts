/*
  CHESS RATING SYNC — fetches player data from external sources and updates Firestore.
  Called by the API route /api/sync-chess-ratings (which is triggered monthly by a cron).

  ── 1. ISRAELI CHESS FEDERATION (chess.org.il) ──
  Uses ASP.NET WebForms postback pagination with __VIEWSTATE hidden fields.

  ── 2. FIDE (fide.com) ──
  Monthly XML ratings file.

  ── 3. MERGE INTO FIRESTORE ──
  Batch-writes matched rating updates.
*/

import { db } from "@/firebase/firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import type { Child } from "./types";

// ── Shared types ──

export interface IsraeliPlayerRow {
  israeli_player_id: string;
  full_name: string;
  israeli_rating: number;
  title: string;
}

export type FideMap = Map<string, { fide_rating: number; title: string }>;

export interface SyncSummary {
  updated: number;
  skipped: number;
  errors: string[];
}

// ── 1. Scrape Israeli ratings ──

// Parse player rows from chess.org.il HTML table
function parseIsraeliTable(html: string): IsraeliPlayerRow[] {
  const rows: IsraeliPlayerRow[] = [];
  const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").trim();
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cells: string[] = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(rowMatch[0])) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }
    if (cells.length >= 4) {
      const rating = parseInt(cells[2], 10);
      if (!isNaN(rating) && rating > 0) {
        rows.push({ israeli_player_id: cells[0], full_name: cells[1], israeli_rating: rating, title: cells[3] || "" });
      }
    }
  }
  return rows;
}

// Fetch all pages from chess.org.il (~68 pages, 100 players each)
export async function scrapeIsraeliRatings(): Promise<IsraeliPlayerRow[]> {
  const BASE_URL = "https://chess.org.il/ratings";
  const all: IsraeliPlayerRow[] = [];

  const firstRes = await fetch(BASE_URL, { headers: { "User-Agent": "ChessNimbus/1.0" } });
  if (!firstRes.ok) throw new Error(`chess.org.il returned ${firstRes.status}`);
  const firstHtml = await firstRes.text();
  all.push(...parseIsraeliTable(firstHtml));

  function extractField(html: string, name: string): string {
    const m = new RegExp(`name="${name}"[^>]*value="([^"]*)"`, "i").exec(html);
    return m ? m[1] : "";
  }

  const viewstate = extractField(firstHtml, "__VIEWSTATE");
  const eventvalidation = extractField(firstHtml, "__EVENTVALIDATION");

  // POST for each subsequent page until we get no new rows
  for (let page = 2; page <= 70; page++) {
    const body = new URLSearchParams({
      __VIEWSTATE: viewstate,
      __EVENTVALIDATION: eventvalidation,
      __EVENTTARGET: "PageNumber",
      __EVENTARGUMENT: String(page),
    });

    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "ChessNimbus/1.0" },
      body: body.toString(),
    });
    if (!res.ok) break;

    const rows = parseIsraeliTable(await res.text());
    if (rows.length === 0) break;
    all.push(...rows);
  }

  return all;
}

// ── 2. Fetch FIDE ratings ──

// Parse the FIDE monthly XML and return a map: fide_id → { fide_rating, title }
export async function fetchFideRatings(): Promise<FideMap> {
  const url = "https://ratings.fide.com/download/standard_rating_list_xml.zip";
  const map: FideMap = new Map();

  const res = await fetch(url, { headers: { "User-Agent": "ChessNimbus/1.0" } });
  if (!res.ok) throw new Error(`FIDE download returned ${res.status}`);

  const text = await res.text();
  const playerRegex = /<player>([\s\S]*?)<\/player>/gi;

  function tagVal(block: string, tag: string): string {
    const m = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(block);
    return m ? m[1].trim() : "";
  }

  let match: RegExpExecArray | null;
  while ((match = playerRegex.exec(text)) !== null) {
    const fideId = tagVal(match[1], "fideid");
    const rating = parseInt(tagVal(match[1], "rating"), 10);
    const title = tagVal(match[1], "title");
    if (fideId && !isNaN(rating) && rating > 0) {
      map.set(fideId, { fide_rating: rating, title });
    }
  }

  return map;
}

// ── 3. Sync to Firestore ──

// Match students by player IDs and batch-write rating updates
export async function syncRatingsToFirestore(
  israeliData: IsraeliPlayerRow[],
  fideData: FideMap
): Promise<SyncSummary> {
  const summary: SyncSummary = { updated: 0, skipped: 0, errors: [] };

  const israeliMap = new Map(israeliData.map((r) => [r.israeli_player_id, r]));

  const snap = await getDocs(collection(db, "students"));
  const students = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Child));

  const BATCH_SIZE = 400;
  let batch = writeBatch(db);
  let batchCount = 0;

  for (const student of students) {
    const updates: Partial<Child> = {};

    if (student.israeli_chess_id) {
      const match = israeliMap.get(student.israeli_chess_id);
      if (match) { updates.israeli_rating = match.israeli_rating; if (match.title) updates.chess_title = match.title; }
    }

    if (student.fide_id) {
      const match = fideData.get(student.fide_id);
      if (match) { updates.fide_rating = match.fide_rating; if (match.title && !updates.chess_title) updates.chess_title = match.title; }
    }

    if (Object.keys(updates).length === 0) { summary.skipped++; continue; }

    try {
      batch.update(doc(db, "students", student.id), updates as object);
      batchCount++;
      summary.updated++;
      if (batchCount >= BATCH_SIZE) { await batch.commit(); batch = writeBatch(db); batchCount = 0; }
    } catch (err) {
      summary.errors.push(`${student.id}: ${String(err)}`);
    }
  }

  if (batchCount > 0) await batch.commit();
  return summary;
}
