/*
  טסט: זיהוי קונפליקט חדר בין תחרות חוזרת לתחרות רגילה.
  הרצה: node scripts/testRoomConflict.mjs

  תרחיש:
  - "ליגת הצעירים" — חוזרת, שישי 16:00-17:30, אולם תחרויות
  - "תחרות פתיחת עונה" — לא חוזרת, סיבובים בשישי 17:00-19:00, אולם תחרויות
  ← חופפים בחדר ובזמן — צפוי קונפליקט!
*/

// ─── עותק מ-tournamentHelpers.ts (פונקציות טהורות) ───

function timeToMins(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function timesOverlap(s1, e1, s2, e2) {
  return timeToMins(s1) < timeToMins(e2) && timeToMins(s2) < timeToMins(e1);
}

function getRecurringTournamentConflicts(tournament, allTournaments) {
  if (
    !tournament.is_recurring ||
    !tournament.recurring_date ||
    !tournament.recurring_start_time ||
    !tournament.recurring_end_time ||
    !tournament.room
  ) return [];

  const { room, recurring_start_time, recurring_end_time, recurring_date } = tournament;
  const [ty, tm, td] = recurring_date.split("-").map(Number);
  const recurringDow = new Date(ty, tm - 1, td).getDay();

  const conflicts = [];

  for (const t of allTournaments) {
    if (t.id === tournament.id) continue;
    if (t.status === "בוטל") continue;
    if (t.room !== room) continue;

    if (t.is_recurring && t.recurring_date && t.recurring_start_time && t.recurring_end_time) {
      const [oty, otm, otd] = t.recurring_date.split("-").map(Number);
      const otDow = new Date(oty, otm - 1, otd).getDay();
      if (otDow === recurringDow && timesOverlap(recurring_start_time, recurring_end_time, t.recurring_start_time, t.recurring_end_time)) {
        conflicts.push(`תחרות: ${t.name}`);
      }
    } else {
      for (const round of t.rounds ?? []) {
        const [rry, rrm, rrd] = round.date.split("-").map(Number);
        const rDow = new Date(rry, rrm - 1, rrd).getDay();
        if (rDow === recurringDow && timesOverlap(recurring_start_time, recurring_end_time, round.start_time, round.end_time)) {
          conflicts.push(`תחרות: ${t.name}`);
          break;
        }
      }
    }
  }

  return [...new Set(conflicts)];
}

function roundConflictsWithTournaments(round, allTournaments, ignoreTournamentId) {
  const [ry, rm, rd] = round.date.split("-").map(Number);
  const roundDow = new Date(ry, rm - 1, rd).getDay();

  for (const t of allTournaments) {
    if (t.id === ignoreTournamentId) continue;
    if (t.status === "בוטל") continue;

    for (const other of t.rounds ?? []) {
      if (other.date !== round.date) continue;
      if (timesOverlap(round.start_time, round.end_time, other.start_time, other.end_time)) return true;
    }

    if (t.is_recurring && t.recurring_date && t.recurring_start_time && t.recurring_end_time) {
      const [ty, tm, td] = t.recurring_date.split("-").map(Number);
      const tDow = new Date(ty, tm - 1, td).getDay();
      if (tDow === roundDow && timesOverlap(round.start_time, round.end_time, t.recurring_start_time, t.recurring_end_time)) {
        return true;
      }
    }
  }
  return false;
}

// ─── נתוני הטסט (מה-Firestore) ───

const ligaHatzeirim = {
  id: "liga1",
  name: "ליגת הצעירים",
  is_recurring: true,
  recurring_date: "2026-05-08", // שישי
  recurring_start_time: "16:00",
  recurring_end_time: "17:30",
  room: "אולם תחרויות",
  rounds: [],
};

const pitchatShana = {
  id: "pitcha1",
  name: "תחרות פתיחת עונה",
  is_recurring: false,
  room: "אולם תחרויות",
  rounds: [
    { id: "r1", round_number: 1, date: "2026-05-15", start_time: "17:00", end_time: "19:00" }, // שישי
    { id: "r2", round_number: 2, date: "2026-05-22", start_time: "17:00", end_time: "19:00" }, // שישי
    { id: "r3", round_number: 3, date: "2026-05-29", start_time: "17:00", end_time: "19:00" }, // שישי
  ],
};

const allTournaments = [ligaHatzeirim, pitchatShana];

// ─── בדיקה 1: עריכת ליגת הצעירים — צפי קונפליקט ───
console.log("\n=== בדיקה 1: עריכת ליגת הצעירים (חוזרת) ===");
const conflicts1 = getRecurringTournamentConflicts(ligaHatzeirim, allTournaments);
console.log(`קונפליקטים שנמצאו: ${JSON.stringify(conflicts1)}`);
const test1 = conflicts1.includes("תחרות: תחרות פתיחת עונה");
console.log(`תוצאה: ${test1 ? "✓ PASS" : "✗ FAIL — לא זוהה קונפליקט!"}`);

// ─── בדיקה 2: סיבוב של תחרות פתיחת עונה — צפי קונפליקט עם ליגה ───
console.log("\n=== בדיקה 2: סיבוב 1 של תחרות פתיחת עונה ===");
const round1 = pitchatShana.rounds[0];
const conflict2 = roundConflictsWithTournaments(round1, allTournaments, "pitcha1");
console.log(`קונפליקט עם תחרות חוזרת: ${conflict2}`);
const test2 = conflict2 === true;
console.log(`תוצאה: ${test2 ? "✓ PASS" : "✗ FAIL — לא זוהה קונפליקט!"}`);

// ─── בדיקה 3: ללא קונפליקט — חדר שונה ───
console.log("\n=== בדיקה 3: אותו יום ושעה אבל חדר אחר — ללא קונפליקט ───");
const ligaOtherRoom = { ...ligaHatzeirim, room: "חדר 1" };
const conflicts3 = getRecurringTournamentConflicts(ligaOtherRoom, allTournaments);
const test3 = conflicts3.length === 0;
console.log(`קונפליקטים: ${JSON.stringify(conflicts3)}`);
console.log(`תוצאה: ${test3 ? "✓ PASS" : "✗ FAIL — זיהוי שגוי!"}`);

// ─── בדיקה 4: ללא קונפליקט — שעות לא חופפות ───
console.log("\n=== בדיקה 4: אותו חדר אבל שעות לא חופפות — ללא קונפליקט ───");
const ligaEarlyTime = { ...ligaHatzeirim, recurring_start_time: "14:00", recurring_end_time: "15:30" };
const conflicts4 = getRecurringTournamentConflicts(ligaEarlyTime, allTournaments);
const test4 = conflicts4.length === 0;
console.log(`קונפליקטים: ${JSON.stringify(conflicts4)}`);
console.log(`תוצאה: ${test4 ? "✓ PASS" : "✗ FAIL — זיהוי שגוי!"}`);

// ─── סיכום ───
const allPassed = test1 && test2 && test3 && test4;
console.log(`\n${allPassed ? "✓ כל הטסטים עברו!" : "✗ לפחות טסט אחד נכשל"}\n`);
