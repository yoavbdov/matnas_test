/*
  טסט: זיהוי מחסור ציוד כששתי תחרויות מתחרות על אותו ציוד באותה שעה.
  מריץ את אותה לוגיקה כמו TournamentEquipmentSelect.

  הרצה: npx ts-node scripts/testEquipmentConflict.ts
*/

import { calcUsedAtWindow } from "../lib/classHelpers";
import type { Tournament } from "../lib/types";

const DGT_ID = "ULqW4YU3M6J7iPiVNMdB";
const DGT_TOTAL = 10;

// ליגת הצעירים — recurring, יום שישי 16:00–17:30, צריכה 7 שעוני DGT
const ligaHatzeirim: Tournament = {
  id: "liga1",
  name: "ליגת הצעירים",
  is_recurring: true,
  recurring_date: "2026-05-08", // יום שישי
  recurring_start_time: "16:00",
  recurring_end_time: "17:30",
  resource_assignments: [{ resource_id: DGT_ID, quantity: 7 }],
  recurring_resource_assignments: [
    { resource_id: "dDVkG4K53z9u4G91DAUt", quantity: 5 },
    { resource_id: "ZLDeMDI2AZAHojQUInuT", quantity: 5 },
  ],
  rounds: [],
  participant_ids: [],
  manual_participants: [],
  status: "פעיל",
  created_at: "2026-05-11",
  color: "#8b5cf6",
  description: "",
  notes: "",
  room: "",
};

// תחרות פתיחת עונה — non-recurring, סיבוב ראשון יום שישי 17:00–19:00, צריכה 8 שעוני DGT
const pitchatShaná: Tournament = {
  id: "pitcha1",
  name: "תחרות פתיחת עונה",
  is_recurring: false,
  rounds: [
    {
      id: "r1",
      round_number: 1,
      date: "2026-05-15", // יום שישי
      start_time: "17:00",
      end_time: "19:00",
      location: "אולם תחרויות",
      notes: "",
      resource_assignments: [],
    },
  ],
  resource_assignments: [
    { resource_id: "sFeBMbXZeJpxVaCsS4wW", quantity: 8 },
    { resource_id: DGT_ID, quantity: 8 },
  ],
  participant_ids: [],
  manual_participants: [],
  status: "מתוכנן",
  created_at: "2026-05-11",
  color: "#f97316",
  description: "",
  notes: "",
  room: "",
};

const allTournaments = [ligaHatzeirim, pitchatShaná];
const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// ─── בדיקה 1: כשפותחים ליגת הצעירים ───
console.log("\n=== עריכת ליגת הצעירים ===");
const dayLiga = HEBREW_DAYS[new Date("2026-05-08").getDay()];
console.log(`יום: ${dayLiga} (צפוי: שישי)`);

const usedForLiga = calcUsedAtWindow(
  DGT_ID, dayLiga, "16:00", "17:30",
  [], undefined, allTournaments, "liga1"
);
const availableForLiga = DGT_TOTAL - usedForLiga;
const ligaNeed = 7;
const ligaShortage = ligaNeed > availableForLiga;

console.log(`משתמש אחרים: ${usedForLiga} (צפוי: 8)`);
console.log(`פנוי: ${availableForLiga} (צפוי: 2)`);
console.log(`מחסור: ${ligaShortage} (צפוי: true) ${ligaShortage ? "✓" : "✗ FAIL"}`);

// ─── בדיקה 2: כשפותחים תחרות פתיחת עונה ───
console.log("\n=== עריכת תחרות פתיחת עונה ===");
const dayPitcha = HEBREW_DAYS[new Date("2026-05-15").getDay()];
console.log(`יום: ${dayPitcha} (צפוי: שישי)`);

const usedForPitcha = calcUsedAtWindow(
  DGT_ID, dayPitcha, "17:00", "19:00",
  [], undefined, allTournaments, "pitcha1"
);
const availableForPitcha = DGT_TOTAL - usedForPitcha;
const pitchaNeed = 8;
const pitchaShortage = pitchaNeed > availableForPitcha;

console.log(`משתמשים אחרים: ${usedForPitcha} (צפוי: 7)`);
console.log(`פנוי: ${availableForPitcha} (צפוי: 3)`);
console.log(`מחסור: ${pitchaShortage} (צפוי: true) ${pitchaShortage ? "✓" : "✗ FAIL"}`);

// ─── סיכום ───
const passed = ligaShortage && pitchaShortage;
console.log(`\n${passed ? "✓ כל הטסטים עברו!" : "✗ יש כישלון — צריך לתקן"}`);
