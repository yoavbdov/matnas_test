/*
  טסט: זיהוי מחסור ציוד כששתי תחרויות מתחרות על אותו ציוד באותה שעה.
  הרצה: node scripts/testEquipmentConflict.mjs
*/

// ─── עותק של הפונקציות מ-classHelpers.ts ───
const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function timeToMins(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function timesOverlap(s1, e1, s2, e2) {
  return timeToMins(s1) < timeToMins(e2) && timeToMins(s2) < timeToMins(e1);
}

function getAssignedQty(assignments, resourceId) {
  return assignments?.find((a) => a.resource_id === resourceId)?.quantity ?? 0;
}

function calcUsedAtWindow(resourceId, day, startTime, endTime, allClasses, ignoreClassId, allTournaments, ignoreTournamentId) {
  let count = 0;

  for (const t of allTournaments) {
    if (t.id === ignoreTournamentId) continue;
    if (t.is_recurring) {
      // Check both fields — the form saves to resource_assignments, but older data may use recurring_resource_assignments
      const qty = getAssignedQty(t.resource_assignments, resourceId) ||
                  getAssignedQty(t.recurring_resource_assignments, resourceId);
      if (qty === 0 || !t.recurring_date) continue;
      const [y, m, d] = t.recurring_date.split("-").map(Number);
      const tDay = HEBREW_DAYS[new Date(y, m - 1, d).getDay()];
      console.log(`  [recurring check] ${t.name}: qty=${qty}, tDay=${tDay}, day=${day}, overlap=${timesOverlap(startTime, endTime, t.recurring_start_time ?? "00:00", t.recurring_end_time ?? "01:00")}`);
      if (tDay === day && timesOverlap(startTime, endTime, t.recurring_start_time ?? "00:00", t.recurring_end_time ?? "01:00")) {
        count += qty;
      }
    } else {
      const qty = getAssignedQty(t.resource_assignments, resourceId);
      if (qty === 0) continue;
      for (const round of t.rounds ?? []) {
        if (!round.date) continue;
        const [y, m, d] = round.date.split("-").map(Number);
        const rDay = HEBREW_DAYS[new Date(y, m - 1, d).getDay()];
        console.log(`  [non-recurring round] ${t.name} round ${round.round_number}: qty=${qty}, rDay=${rDay}, day=${day}, overlap=${timesOverlap(startTime, endTime, round.start_time, round.end_time)}`);
        if (rDay === day && timesOverlap(startTime, endTime, round.start_time, round.end_time)) {
          count += qty;
          break;
        }
      }
    }
  }

  return count;
}

// ─── נתוני הטסט (בדיוק מה-Firestore) ───
const DGT_ID = "ULqW4YU3M6J7iPiVNMdB";
const DGT_TOTAL = 10;

const ligaHatzeirim = {
  id: "liga1",
  name: "ליגת הצעירים",
  is_recurring: true,
  recurring_date: "2026-05-08",
  recurring_start_time: "16:00",
  recurring_end_time: "17:30",
  resource_assignments: [{ resource_id: DGT_ID, quantity: 7 }],
  recurring_resource_assignments: [
    { resource_id: "dDVkG4K53z9u4G91DAUt", quantity: 5 },
    { resource_id: "ZLDeMDI2AZAHojQUInuT", quantity: 5 },
  ],
  rounds: [],
};

const pitchatShana = {
  id: "pitcha1",
  name: "תחרות פתיחת עונה",
  is_recurring: false,
  rounds: [
    { id: "r1", round_number: 1, date: "2026-05-15", start_time: "17:00", end_time: "19:00", resource_assignments: [] },
    { id: "r2", round_number: 2, date: "2026-05-22", start_time: "17:00", end_time: "19:00", resource_assignments: [] },
    { id: "r3", round_number: 3, date: "2026-05-29", start_time: "17:00", end_time: "19:00", resource_assignments: [] },
  ],
  resource_assignments: [
    { resource_id: "sFeBMbXZeJpxVaCsS4wW", quantity: 8 },
    { resource_id: DGT_ID, quantity: 8 },
  ],
};

const allTournaments = [ligaHatzeirim, pitchatShana];

// ─── בדיקה 1: עריכת ליגת הצעירים ───
console.log("\n=== עריכת ליגת הצעירים ===");
const dayLiga = HEBREW_DAYS[new Date("2026-05-08").getDay()];
console.log(`יום ה-recurring_date: ${dayLiga} (צפוי: שישי)`);

const usedForLiga = calcUsedAtWindow(DGT_ID, dayLiga, "16:00", "17:30", [], undefined, allTournaments, "liga1");
const availableForLiga = DGT_TOTAL - usedForLiga;
const ligaShortage = 7 > availableForLiga;
console.log(`usedElsewhere: ${usedForLiga} (צפוי: 8) | available: ${availableForLiga} (צפוי: 2) | מחסור: ${ligaShortage} ${ligaShortage ? "✓" : "✗ FAIL"}`);

// ─── בדיקה 2: עריכת תחרות פתיחת עונה ───
console.log("\n=== עריכת תחרות פתיחת עונה ===");
// TournamentEquipmentSelect uses new Date(date).getDay() (string parse = UTC midnight)
const dayPitchaFromString = HEBREW_DAYS[new Date("2026-05-15").getDay()];
// classHelpers uses new Date(y, m-1, d) (local time)
const [py, pm, pd] = "2026-05-08".split("-").map(Number);
const dayLigaFromLocal = HEBREW_DAYS[new Date(py, pm - 1, pd).getDay()];
console.log(`יום מ-string parse (TournamentEquipmentSelect): ${dayPitchaFromString}`);
console.log(`יום מ-local Date (classHelpers): ${dayLigaFromLocal}`);
console.log(`תואמים? ${dayPitchaFromString === dayLigaFromLocal ? "✓" : "✗ — זו הבעיה!"}`);

const usedForPitcha = calcUsedAtWindow(DGT_ID, dayPitchaFromString, "17:00", "19:00", [], undefined, allTournaments, "pitcha1");
const availableForPitcha = DGT_TOTAL - usedForPitcha;
const pitchaShortage = 8 > availableForPitcha;
console.log(`usedElsewhere: ${usedForPitcha} (צפוי: 7) | available: ${availableForPitcha} (צפוי: 3) | מחסור: ${pitchaShortage} ${pitchaShortage ? "✓" : "✗ FAIL"}`);

// ─── סיכום ───
const allPassed = ligaShortage && pitchaShortage;
console.log(`\n${allPassed ? "✓ כל הטסטים עברו!" : "✗ לפחות טסט אחד נכשל"}`);
