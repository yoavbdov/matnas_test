// Run: node scripts/seed.mjs
// Seeds Firestore with demo data for the chess school management system.
// Requires firebase-admin-sdk.json in the project root (git-ignored).
// Field names match the TypeScript types in lib/types.ts (snake_case).

import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const admin = require("firebase-admin");

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "../firebase-admin-sdk.json"), "utf8")
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Helper: generate a random UUID (used for ScheduleSlot ids)
function uuid() {
  return crypto.randomUUID();
}

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`  cleared ${snap.size} docs from "${name}"`);
}

async function seed() {
  // All collections the app reads — all are cleared and re-seeded
  const COLLECTIONS = [
    "teachers",
    "rooms",
    "physicalEquipment",
    "classes",
    "students",
    "enrollments",
    "tournaments",
    "leagueGroups",
    "leagueGroupMembers",
  ];

  console.log("Clearing existing data...");
  for (const col of COLLECTIONS) await clearCollection(col);

  // ── TEACHERS (מדריכים) ────────────────────────────────────────────────────
  // Fields match the Teacher interface in lib/types.ts
  console.log("\nSeeding teachers...");
  const teachers = [
    {
      first_name: "יוסי",
      last_name: "כהן",
      phone: "050-1234567",
      email: "yossi@chess.co.il",
      certifications: ["FM", "מאמן מוסמך"],
      notes: "",
      status: "פעיל",
    },
    {
      first_name: "מירב",
      last_name: "לוי",
      phone: "052-2345678",
      email: "merav@chess.co.il",
      certifications: ["מאמן מוסמך"],
      notes: "",
      status: "פעיל",
    },
    {
      first_name: "אמיר",
      last_name: "ביטון",
      phone: "054-3456789",
      email: "amir@chess.co.il",
      certifications: ["IM", "מאמן בכיר"],
      notes: "",
      status: "פעיל",
    },
    {
      first_name: "רחל",
      last_name: "אזולאי",
      phone: "053-4567890",
      email: "rachel@chess.co.il",
      certifications: ["מאמן מוסמך"],
      notes: "",
      status: "פעיל",
    },
  ];
  const teacherIds = {};
  for (const t of teachers) {
    const ref = await db.collection("teachers").add(t);
    teacherIds[`${t.first_name} ${t.last_name}`] = ref.id;
    console.log(`  + ${t.first_name} ${t.last_name} (${ref.id})`);
  }

  // ── ROOMS (חדרים) ──────────────────────────────────────────────────────────
  // Fields match the Room interface in lib/types.ts
  console.log("\nSeeding rooms...");
  const rooms = [
    { name: "חדר שחמט קטן",  number: "101", capacity: 15, features: ["לוחות שחמט", "שעוני שחמט"], notes: "" },
    { name: "חדר שחמט גדול", number: "102", capacity: 40, features: ["לוחות שחמט", "שעוני שחמט", "כיסאות מתקפלים"], notes: "" },
    { name: "חדר מחשבים",    number: "103", capacity: 20, features: ["מחשבים"], notes: "" },
    { name: "אולם תחרויות",  number: "200", capacity: 60, features: ["שעוני DGT", "לוחות DGT"], notes: "" },
  ];
  const roomIds = {};
  for (const r of rooms) {
    const ref = await db.collection("rooms").add(r);
    roomIds[r.name] = ref.id;
    console.log(`  + ${r.name} (${ref.id})`);
  }

  // ── PHYSICAL EQUIPMENT (ציוד פיזי) ────────────────────────────────────────
  // Fields match the PhysicalEquipment interface in lib/types.ts
  console.log("\nSeeding physicalEquipment...");
  const equipment = [
    { name: "לוחות שחמט",   quantity: 30, notes: "" },
    { name: "שעוני שחמט",   quantity: 20, notes: "" },
    { name: "שעוני DGT",    quantity: 10, notes: "שעונים דיגיטליים לתחרויות" },
    { name: "לוחות DGT",    quantity: 10, notes: "לוחות דיגיטליים לתחרויות" },
    { name: "ערכות שחמט",   quantity: 15, notes: "ערכות ניידות לקורסים" },
  ];
  const equipmentIds = {};
  for (const e of equipment) {
    const ref = await db.collection("physicalEquipment").add(e);
    equipmentIds[e.name] = ref.id;
    console.log(`  + ${e.name} (${ref.id})`);
  }

  // ── CLASSES (חוגים) ────────────────────────────────────────────────────────
  // Fields match the Class interface in lib/types.ts
  // Each ScheduleSlot MUST have an id (uuid)
  console.log("\nSeeding classes...");
  const classesData = [
    {
      name: "שחמט מתחילים",
      description: "קורס שחמט לילדים ללא ניסיון קודם",
      teacher_id: teacherIds["יוסי כהן"],
      capacity: 15,
      age_min: 6,  age_max: 10,
      rating_min: 0, rating_max: 1200,
      status: "פעיל",
      color: "#4CAF50",
      notes: "",
      resource_assignments: [
        { resource_id: equipmentIds["לוחות שחמט"], quantity: 8 },
        { resource_id: equipmentIds["שעוני שחמט"], quantity: 8 },
      ],
      slots: [
        { id: uuid(), day: "ראשון",  start_time: "16:00", end_time: "17:00", room_id: roomIds["חדר שחמט קטן"], recurrence: "שבועי", start_date: "2026-01-01" },
        { id: uuid(), day: "שלישי", start_time: "16:00", end_time: "17:00", room_id: roomIds["חדר שחמט קטן"], recurrence: "שבועי", start_date: "2026-01-01" },
      ],
    },
    {
      name: "שחמט מתקדמים",
      description: "אימון שחמט לשחקנים בעלי ניסיון",
      teacher_id: teacherIds["מירב לוי"],
      capacity: 20,
      age_min: 10, age_max: 18,
      rating_min: 1200, rating_max: 2000,
      status: "פעיל",
      color: "#2196F3",
      notes: "",
      resource_assignments: [
        { resource_id: equipmentIds["לוחות שחמט"], quantity: 10 },
        { resource_id: equipmentIds["שעוני שחמט"], quantity: 10 },
      ],
      slots: [
        { id: uuid(), day: "שני",   start_time: "17:00", end_time: "19:00", room_id: roomIds["חדר שחמט גדול"], recurrence: "שבועי", start_date: "2026-01-01" },
        { id: uuid(), day: "רביעי", start_time: "17:00", end_time: "19:00", room_id: roomIds["חדר שחמט גדול"], recurrence: "שבועי", start_date: "2026-01-01" },
      ],
    },
    {
      name: "אימון קבוצתי",
      description: "אימון אינטנסיבי לשחקנים מתחרים",
      teacher_id: teacherIds["אמיר ביטון"],
      capacity: 20,
      age_min: 12, age_max: 18,
      rating_min: 1500, rating_max: 2500,
      status: "פעיל",
      color: "#FF5722",
      notes: "",
      resource_assignments: [
        { resource_id: equipmentIds["לוחות DGT"],  quantity: 5 },
        { resource_id: equipmentIds["שעוני DGT"],  quantity: 5 },
      ],
      slots: [
        // יום חמישי 16:00-18:00 — מדגים קונפליקט עם התחרות השבועית (ראה tournaments)
        { id: uuid(), day: "חמישי", start_time: "16:00", end_time: "18:00", room_id: roomIds["אולם תחרויות"], recurrence: "שבועי", start_date: "2026-01-01" },
      ],
    },
    {
      name: "שחמט מחשב",
      description: "שחמט בסביבה ממוחשבת — ניתוח משחקים ותוכנות",
      teacher_id: teacherIds["רחל אזולאי"],
      capacity: 20,
      age_min: 8,  age_max: 16,
      rating_min: 0, rating_max: 1500,
      status: "פעיל",
      color: "#9C27B0",
      notes: "",
      resource_assignments: [],
      slots: [
        { id: uuid(), day: "שלישי", start_time: "15:00", end_time: "16:30", room_id: roomIds["חדר מחשבים"], recurrence: "שבועי", start_date: "2026-01-01" },
      ],
    },
    {
      name: "מועדון בוגרים",
      description: "מפגש שבועי לשחקנים בוגרים",
      teacher_id: teacherIds["יוסי כהן"],
      capacity: 30,
      age_min: 18, age_max: 99,
      rating_min: 1800, rating_max: 3000,
      status: "פעיל",
      color: "#FF9800",
      notes: "",
      resource_assignments: [
        { resource_id: equipmentIds["לוחות שחמט"], quantity: 15 },
        { resource_id: equipmentIds["שעוני שחמט"], quantity: 15 },
      ],
      slots: [
        { id: uuid(), day: "שישי", start_time: "10:00", end_time: "13:00", room_id: roomIds["חדר שחמט גדול"], recurrence: "שבועי", start_date: "2026-01-01" },
      ],
    },
  ];
  const classIds = {};
  for (const c of classesData) {
    const ref = await db.collection("classes").add(c);
    classIds[c.name] = ref.id;
    console.log(`  + ${c.name} (${ref.id})`);
  }

  // ── STUDENTS (שחקנים) ─────────────────────────────────────────────────────
  // Fields match the Student interface in lib/types.ts
  // Optional fields are omitted (not null) — undefined is the correct TS default
  console.log("\nSeeding students...");
  const today = new Date().toISOString().slice(0, 10);
  const students = [
    { first_name: "נועם",  last_name: "כץ",      dob: "2013-03-15", phone: "050-1111111", parent_name: "דני כץ",      parent_phone: "050-1111110", israeli_id: "311111111", israeli_chess_id: "10001", israeli_rating: 850,  status: "פעיל", created_at: today },
    { first_name: "שיר",   last_name: "מזרחי",   dob: "2011-07-22", phone: "052-2222222", parent_name: "רות מזרחי",   parent_phone: "052-2222220", israeli_id: "322222222", israeli_chess_id: "10002", fide_id: "20002", israeli_rating: 1350, fide_rating: 1280, status: "פעיל", created_at: today },
    { first_name: "עידן",  last_name: "פרץ",      dob: "2012-01-10", phone: "054-3333333", parent_name: "יעל פרץ",     parent_phone: "054-3333330", israeli_id: "333333333", israeli_chess_id: "10003", israeli_rating: 1100, notes: "מתחיל לשחק תחרויות השנה", status: "פעיל", created_at: today },
    { first_name: "מיה",   last_name: "שפירא",   dob: "2010-09-05", phone: "053-4444444", parent_name: "אבי שפירא",   parent_phone: "053-4444440", israeli_id: "344444444", israeli_chess_id: "10004", fide_id: "20004", israeli_rating: 1650, fide_rating: 1590, status: "פעיל", created_at: today },
    { first_name: "אורי",  last_name: "גולן",    dob: "2014-06-18", phone: "050-5555555", parent_name: "לילה גולן",   parent_phone: "050-5555550", israeli_id: "355555555", israeli_chess_id: "10005", israeli_rating: 600,  notes: "אח של נטע גולן", status: "פעיל", created_at: today },
    { first_name: "תמר",   last_name: "אברהם",   dob: "2009-11-30", phone: "052-6666666", parent_name: "משה אברהם",   parent_phone: "052-6666660", israeli_id: "366666666", israeli_chess_id: "10006", fide_id: "20006", israeli_rating: 1900, fide_rating: 1830, chess_title: "FM", status: "פעיל", created_at: today },
    { first_name: "יובל",  last_name: "דוד",      dob: "2013-04-25", phone: "054-7777777", parent_name: "נחמה דוד",    parent_phone: "054-7777770", israeli_id: "377777777", israeli_chess_id: "10007", israeli_rating: 750,  status: "פעיל", created_at: today },
    { first_name: "ליאור", last_name: "ברק",      dob: "2011-02-14", phone: "053-8888888", parent_name: "שרה ברק",     parent_phone: "053-8888880", israeli_id: "388888888", israeli_chess_id: "10008", fide_id: "20008", israeli_rating: 1450, fide_rating: 1380, status: "פעיל", created_at: today },
    { first_name: "נטע",   last_name: "חיים",    dob: "2012-08-07", phone: "050-9999999", parent_name: "יצחק חיים",   parent_phone: "050-9999990", israeli_id: "399999999", israeli_chess_id: "10009", israeli_rating: 980,  status: "פעיל", created_at: today },
    { first_name: "רון",   last_name: "סעדון",   dob: "2010-05-12", phone: "052-0000001", parent_name: "פנינה סעדון",  parent_phone: "052-0000000", israeli_id: "300000001", israeli_chess_id: "10010", fide_id: "20010", israeli_rating: 1750, fide_rating: 1680, status: "פעיל", created_at: today },
  ];
  const studentIds = {};
  for (const s of students) {
    const ref = await db.collection("students").add(s);
    studentIds[`${s.first_name} ${s.last_name}`] = ref.id;
    console.log(`  + ${s.first_name} ${s.last_name} (${ref.id})`);
  }

  // ── ENROLLMENTS (רישומים לחוגים) ──────────────────────────────────────────
  // enrolled_at is YYYY-MM-DD (not full ISO timestamp)
  console.log("\nSeeding enrollments...");
  const enrollments = [
    // שחמט מתחילים (ראשון + שלישי 16:00-17:00)
    { student_id: studentIds["נועם כץ"],    class_id: classIds["שחמט מתחילים"], enrolled_at: today, status: "פעיל" },
    { student_id: studentIds["אורי גולן"],  class_id: classIds["שחמט מתחילים"], enrolled_at: today, status: "פעיל" },
    { student_id: studentIds["יובל דוד"],   class_id: classIds["שחמט מתחילים"], enrolled_at: today, status: "פעיל" },
    { student_id: studentIds["נטע חיים"],   class_id: classIds["שחמט מתחילים"], enrolled_at: today, status: "פעיל" },
    // שחמט מתקדמים (שני + רביעי 17:00-19:00)
    { student_id: studentIds["שיר מזרחי"],  class_id: classIds["שחמט מתקדמים"], enrolled_at: today, status: "פעיל" },
    { student_id: studentIds["עידן פרץ"],   class_id: classIds["שחמט מתקדמים"], enrolled_at: today, status: "פעיל" },
    { student_id: studentIds["ליאור ברק"],  class_id: classIds["שחמט מתקדמים"], enrolled_at: today, status: "פעיל" },
    // אימון קבוצתי (חמישי 16:00-18:00) — מיה ורון גם רשומים לתחרות "ליגת הצעירים" באותו יום
    { student_id: studentIds["מיה שפירא"],  class_id: classIds["אימון קבוצתי"],  enrolled_at: today, status: "פעיל" },
    { student_id: studentIds["תמר אברהם"],  class_id: classIds["אימון קבוצתי"],  enrolled_at: today, status: "פעיל" },
    { student_id: studentIds["רון סעדון"],  class_id: classIds["אימון קבוצתי"],  enrolled_at: today, status: "פעיל" },
    // שחמט מחשב (שלישי 15:00-16:30)
    { student_id: studentIds["נועם כץ"],    class_id: classIds["שחמט מחשב"],     enrolled_at: today, status: "פעיל" },
    { student_id: studentIds["עידן פרץ"],   class_id: classIds["שחמט מחשב"],     enrolled_at: today, status: "פעיל" },
    { student_id: studentIds["נטע חיים"],   class_id: classIds["שחמט מחשב"],     enrolled_at: today, status: "פעיל" },
  ];
  for (const e of enrollments) {
    const ref = await db.collection("enrollments").add(e);
    console.log(`  + enrollment (${ref.id})`);
  }

  // ── TOURNAMENTS (תחרויות) ────────────────────────────────────────────────────
  // participant_ids include actual student IDs to demonstrate conflict detection.
  // judge_id points to a real teacher to demonstrate teacher conflict.
  console.log("\nSeeding tournaments...");

  // תחרות פתיחת עונה — תחרות רגילה עם סיבובים
  const openingTournament = {
    name: "תחרות פתיחת עונה",
    description: "תחרות שחמט לפתיחת שנת הלימודים — כל הרמות מוזמנות",
    status: "מתוכנן",
    age_min: 8,
    age_max: 18,
    rating_min: 0,
    rating_max: 2000,
    is_recurring: false,
    color: "#f97316",
    room: "אולם תחרויות",
    judge_id: teacherIds["אמיר ביטון"], // מדגים קונפליקט: אמיר גם מלמד "אימון קבוצתי" ביום חמישי
    rounds: [
      { id: uuid(), round_number: 1, date: "2026-05-15", start_time: "17:00", end_time: "19:00", location: "אולם תחרויות", notes: "", resource_assignments: [] },
      { id: uuid(), round_number: 2, date: "2026-05-22", start_time: "17:00", end_time: "19:00", location: "אולם תחרויות", notes: "", resource_assignments: [] },
      { id: uuid(), round_number: 3, date: "2026-05-29", start_time: "17:00", end_time: "19:00", location: "אולם תחרויות", notes: "", resource_assignments: [] },
    ],
    // מיה ושיר רשומות לתחרות — מיה גם ב"אימון קבוצתי" (שישי שונה, אין קונפליקט)
    participant_ids: [studentIds["מיה שפירא"], studentIds["שיר מזרחי"], studentIds["תמר אברהם"]],
    manual_participants: [
      { id: uuid(), name: "שחקן חיצוני א'", rating: 1400 },
    ],
    resource_assignments: [
      { resource_id: equipmentIds["לוחות DGT"],  quantity: 8 },
      { resource_id: equipmentIds["שעוני DGT"],  quantity: 8 },
    ],
    notes: "",
    created_at: today,
  };

  // ליגת הצעירים — תחרות חוזרת יום חמישי 16:00-17:30
  // מדגים קונפליקט: מיה ורון גם רשומים ל"אימון קבוצתי" באותו יום ובאותן שעות חופפות
  const youthLeague = {
    name: "ליגת הצעירים",
    description: "ליגה שבועית לשחקנים עד גיל 14",
    status: "פעיל",
    age_min: 6,
    age_max: 14,
    rating_min: 0,
    rating_max: 1500,
    is_recurring: true,
    recurring_date: "2026-05-08", // יום חמישי
    recurring_start_time: "16:00",
    recurring_end_time: "17:30",
    recurring_resource_assignments: [
      { resource_id: equipmentIds["לוחות שחמט"], quantity: 5 },
      { resource_id: equipmentIds["שעוני שחמט"], quantity: 5 },
    ],
    color: "#8b5cf6",
    room: "חדר שחמט קטן",
    judge_id: teacherIds["יוסי כהן"],
    rounds: [],
    // נועם ועידן גם רשומים לחוגים ביום זה — מדגים אזהרת קונפליקט
    participant_ids: [
      studentIds["נועם כץ"],
      studentIds["עידן פרץ"],
      studentIds["אורי גולן"],
    ],
    manual_participants: [],
    resource_assignments: [],
    notes: "",
    created_at: today,
  };

  for (const t of [openingTournament, youthLeague]) {
    const ref = await db.collection("tournaments").add(t);
    console.log(`  + tournament: ${t.name} (${ref.id})`);
  }

  // ── LEAGUE GROUPS (קבוצות ליגה) ───────────────────────────────────────────
  // Fields match the LeagueGroup interface in lib/types.ts
  console.log("\nSeeding leagueGroups...");
  const leagueGroups = [
    {
      name: "קבוצת נוער ארצית",
      category: "נוער",
      leagueType: "ארצית",
      description: "קבוצת הנוער לליגה הארצית",
      status: "פעיל",
      color: "#0ea5e9",
      notes: "",
      created_at: today,
    },
    {
      name: "קבוצת בוגרים ב'",
      category: "בוגרים",
      leagueType: "ב",
      description: "קבוצת הבוגרים לליגה ב'",
      status: "פעיל",
      color: "#f59e0b",
      notes: "",
      created_at: today,
    },
  ];
  const leagueGroupIds = {};
  for (const g of leagueGroups) {
    const ref = await db.collection("leagueGroups").add(g);
    leagueGroupIds[g.name] = ref.id;
    console.log(`  + ${g.name} (${ref.id})`);
  }

  // ── LEAGUE GROUP MEMBERS (חברות בקבוצות ליגה) ─────────────────────────────
  // Fields match the LeagueGroupMember interface in lib/types.ts
  console.log("\nSeeding leagueGroupMembers...");
  const leagueGroupMembers = [
    { group_id: leagueGroupIds["קבוצת נוער ארצית"], student_id: studentIds["מיה שפירא"],  joined_at: today },
    { group_id: leagueGroupIds["קבוצת נוער ארצית"], student_id: studentIds["רון סעדון"],   joined_at: today },
    { group_id: leagueGroupIds["קבוצת נוער ארצית"], student_id: studentIds["תמר אברהם"],  joined_at: today },
    { group_id: leagueGroupIds["קבוצת בוגרים ב'"],  student_id: studentIds["שיר מזרחי"],  joined_at: today },
    { group_id: leagueGroupIds["קבוצת בוגרים ב'"],  student_id: studentIds["ליאור ברק"],  joined_at: today },
  ];
  for (const m of leagueGroupMembers) {
    const ref = await db.collection("leagueGroupMembers").add(m);
    console.log(`  + leagueGroupMember (${ref.id})`);
  }


  console.log("\nSeed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
