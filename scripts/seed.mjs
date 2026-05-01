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

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`  cleared ${snap.size} docs from "${name}"`);
}

async function seed() {
  // Collections must match what the app reads from Firestore
  const COLLECTIONS = ["teachers", "rooms", "physicalEquipment", "classes", "students", "enrollments"];

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
      subject: "שחמט מתחילים",
      certifications: ["FM", "מאמן מוסמך"],
      notes: "",
      status: "פעיל",
    },
    {
      first_name: "מירב",
      last_name: "לוי",
      phone: "052-2345678",
      email: "merav@chess.co.il",
      subject: "שחמט מתקדמים",
      certifications: ["מאמן מוסמך"],
      notes: "",
      status: "פעיל",
    },
    {
      first_name: "אמיר",
      last_name: "ביטון",
      phone: "054-3456789",
      email: "amir@chess.co.il",
      subject: "אימון קבוצתי",
      certifications: ["IM", "מאמן בכיר"],
      notes: "",
      status: "פעיל",
    },
    {
      first_name: "רחל",
      last_name: "אזולאי",
      phone: "053-4567890",
      email: "rachel@chess.co.il",
      subject: "שחמט מחשב",
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

  // ── RESOURCES (ציוד) ───────────────────────────────────────────────────────
  // Fields match the Resource interface in lib/types.ts
  console.log("\nSeeding resources...");
  const resources = [
    { name: "לוחות שחמט",     quantity: 50, notes: "" },
    { name: "שעוני שחמט",     quantity: 30, notes: "" },
    { name: "שעוני DGT",      quantity: 20, notes: "" },
    { name: "לוחות DGT",      quantity: 30, notes: "" },
    { name: "כיסאות מתקפלים", quantity: 40, notes: "" },
  ];
  for (const res of resources) {
    const ref = await db.collection("physicalEquipment").add(res);
    console.log(`  + ${res.name} (${ref.id})`);
  }

  // ── CLASSES (חוגים) ────────────────────────────────────────────────────────
  // Fields match the Class interface in lib/types.ts
  console.log("\nSeeding classes...");
  const classesData = [
    {
      name: "שחמט מתחילים",
      teacher_id: teacherIds["יוסי כהן"],
      capacity: 15,
      age_min: 6,  age_max: 10,
      rating_min: 0, rating_max: 1200,
      status: "פעיל",
      color: "#4CAF50",
      notes: "",
      slots: [
        { day: "ראשון",  start_time: "16:00", end_time: "17:00", room_id: roomIds["חדר שחמט קטן"],  recurrence: "שבועי", start_date: "2026-01-01" },
        { day: "שלישי", start_time: "16:00", end_time: "17:00", room_id: roomIds["חדר שחמט קטן"],  recurrence: "שבועי", start_date: "2026-01-01" },
      ],
    },
    {
      name: "שחמט מתקדמים",
      teacher_id: teacherIds["מירב לוי"],
      capacity: 20,
      age_min: 10, age_max: 18,
      rating_min: 1200, rating_max: 2000,
      status: "פעיל",
      color: "#2196F3",
      notes: "",
      slots: [
        { day: "שני",   start_time: "17:00", end_time: "19:00", room_id: roomIds["חדר שחמט גדול"], recurrence: "שבועי", start_date: "2026-01-01" },
        { day: "רביעי", start_time: "17:00", end_time: "19:00", room_id: roomIds["חדר שחמט גדול"], recurrence: "שבועי", start_date: "2026-01-01" },
      ],
    },
    {
      name: "אימון קבוצתי",
      teacher_id: teacherIds["אמיר ביטון"],
      capacity: 20,
      age_min: 12, age_max: 18,
      rating_min: 1500, rating_max: 2500,
      status: "פעיל",
      color: "#FF5722",
      notes: "",
      slots: [
        { day: "חמישי", start_time: "16:00", end_time: "18:00", room_id: roomIds["אולם תחרויות"],  recurrence: "שבועי", start_date: "2026-01-01" },
      ],
    },
    {
      name: "שחמט מחשב",
      teacher_id: teacherIds["רחל אזולאי"],
      capacity: 20,
      age_min: 8,  age_max: 16,
      rating_min: 0, rating_max: 1500,
      status: "פעיל",
      color: "#9C27B0",
      notes: "",
      slots: [
        { day: "שלישי", start_time: "15:00", end_time: "16:30", room_id: roomIds["חדר מחשבים"],   recurrence: "שבועי", start_date: "2026-01-01" },
      ],
    },
    {
      name: "מועדון בוגרים",
      teacher_id: teacherIds["יוסי כהן"],
      capacity: 30,
      age_min: 18, age_max: 99,
      rating_min: 1800, rating_max: 3000,
      status: "פעיל",
      color: "#FF9800",
      notes: "",
      slots: [
        { day: "שישי",  start_time: "10:00", end_time: "13:00", room_id: roomIds["חדר שחמט גדול"], recurrence: "שבועי", start_date: "2026-01-01" },
      ],
    },
  ];
  const classIds = {};
  for (const c of classesData) {
    const ref = await db.collection("classes").add(c);
    classIds[c.name] = ref.id;
    console.log(`  + ${c.name} (${ref.id})`);
  }

  // ── STUDENTS (תלמידים) ─────────────────────────────────────────────────────
  // Fields match the Student interface in lib/types.ts
  console.log("\nSeeding students...");
  const students = [
    { first_name: "נועם",  last_name: "כץ",      dob: "2013-03-15", phone: "050-1111111", parent_name: "דני כץ",     parent_phone: "050-1111110", israeli_id: "311111111", israeli_chess_id: "10001", fide_id: null,  israeli_rating: 850,  fide_rating: null, chess_title: null, notes: "",                          status: "פעיל" },
    { first_name: "שיר",   last_name: "מזרחי",   dob: "2011-07-22", phone: "052-2222222", parent_name: "רות מזרחי",  parent_phone: "052-2222220", israeli_id: "322222222", israeli_chess_id: "10002", fide_id: "20002", israeli_rating: 1350, fide_rating: 1280, chess_title: null, notes: "",                          status: "פעיל" },
    { first_name: "עידן",  last_name: "פרץ",      dob: "2012-01-10", phone: "054-3333333", parent_name: "יעל פרץ",    parent_phone: "054-3333330", israeli_id: "333333333", israeli_chess_id: "10003", fide_id: null,  israeli_rating: 1100, fide_rating: null, chess_title: null, notes: "מתחיל לשחק תחרויות השנה", status: "פעיל" },
    { first_name: "מיה",   last_name: "שפירא",   dob: "2010-09-05", phone: "053-4444444", parent_name: "אבי שפירא",  parent_phone: "053-4444440", israeli_id: "344444444", israeli_chess_id: "10004", fide_id: "20004", israeli_rating: 1650, fide_rating: 1590, chess_title: null, notes: "",                          status: "פעיל" },
    { first_name: "אורי",  last_name: "גולן",    dob: "2014-06-18", phone: "050-5555555", parent_name: "לילה גולן",  parent_phone: "050-5555550", israeli_id: "355555555", israeli_chess_id: "10005", fide_id: null,  israeli_rating: 600,  fide_rating: null, chess_title: null, notes: "אח של נטע גולן",            status: "פעיל" },
    { first_name: "תמר",   last_name: "אברהם",   dob: "2009-11-30", phone: "052-6666666", parent_name: "משה אברהם",  parent_phone: "052-6666660", israeli_id: "366666666", israeli_chess_id: "10006", fide_id: "20006", israeli_rating: 1900, fide_rating: 1830, chess_title: "FM", notes: "",                          status: "פעיל" },
    { first_name: "יובל",  last_name: "דוד",      dob: "2013-04-25", phone: "054-7777777", parent_name: "נחמה דוד",   parent_phone: "054-7777770", israeli_id: "377777777", israeli_chess_id: "10007", fide_id: null,  israeli_rating: 750,  fide_rating: null, chess_title: null, notes: "",                          status: "פעיל" },
    { first_name: "ליאור", last_name: "ברק",      dob: "2011-02-14", phone: "053-8888888", parent_name: "שרה ברק",    parent_phone: "053-8888880", israeli_id: "388888888", israeli_chess_id: "10008", fide_id: "20008", israeli_rating: 1450, fide_rating: 1380, chess_title: null, notes: "",                          status: "פעיל" },
    { first_name: "נטע",   last_name: "חיים",    dob: "2012-08-07", phone: "050-9999999", parent_name: "יצחק חיים",  parent_phone: "050-9999990", israeli_id: "399999999", israeli_chess_id: "10009", fide_id: null,  israeli_rating: 980,  fide_rating: null, chess_title: null, notes: "",                          status: "פעיל" },
    { first_name: "רון",   last_name: "סעדון",   dob: "2010-05-12", phone: "052-0000001", parent_name: "פנינה סעדון", parent_phone: "052-0000000", israeli_id: "300000001", israeli_chess_id: "10010", fide_id: "20010", israeli_rating: 1750, fide_rating: 1680, chess_title: null, notes: "",                          status: "פעיל" },
  ];
  const studentIds = {};
  for (const s of students) {
    const ref = await db.collection("students").add(s);
    studentIds[`${s.first_name} ${s.last_name}`] = ref.id;
    console.log(`  + ${s.first_name} ${s.last_name} (${ref.id})`);
  }

  // ── ENROLLMENTS (רישומים לחוגים) ──────────────────────────────────────────
  // Fields match the Enrollment interface in lib/types.ts
  console.log("\nSeeding enrollments...");
  const now = new Date().toISOString();
  const enrollments = [
    // שחמט מתחילים
    { student_id: studentIds["נועם כץ"],    class_id: classIds["שחמט מתחילים"], enrolled_at: now, status: "פעיל" },
    { student_id: studentIds["אורי גולן"],  class_id: classIds["שחמט מתחילים"], enrolled_at: now, status: "פעיל" },
    { student_id: studentIds["יובל דוד"],   class_id: classIds["שחמט מתחילים"], enrolled_at: now, status: "פעיל" },
    { student_id: studentIds["נטע חיים"],   class_id: classIds["שחמט מתחילים"], enrolled_at: now, status: "פעיל" },
    // שחמט מתקדמים
    { student_id: studentIds["שיר מזרחי"],  class_id: classIds["שחמט מתקדמים"], enrolled_at: now, status: "פעיל" },
    { student_id: studentIds["עידן פרץ"],   class_id: classIds["שחמט מתקדמים"], enrolled_at: now, status: "פעיל" },
    { student_id: studentIds["ליאור ברק"],  class_id: classIds["שחמט מתקדמים"], enrolled_at: now, status: "פעיל" },
    // אימון קבוצתי
    { student_id: studentIds["מיה שפירא"],  class_id: classIds["אימון קבוצתי"],  enrolled_at: now, status: "פעיל" },
    { student_id: studentIds["תמר אברהם"],  class_id: classIds["אימון קבוצתי"],  enrolled_at: now, status: "פעיל" },
    { student_id: studentIds["רון סעדון"],  class_id: classIds["אימון קבוצתי"],  enrolled_at: now, status: "פעיל" },
    // שחמט מחשב
    { student_id: studentIds["נועם כץ"],    class_id: classIds["שחמט מחשב"],     enrolled_at: now, status: "פעיל" },
    { student_id: studentIds["עידן פרץ"],   class_id: classIds["שחמט מחשב"],     enrolled_at: now, status: "פעיל" },
    { student_id: studentIds["נטע חיים"],   class_id: classIds["שחמט מחשב"],     enrolled_at: now, status: "פעיל" },
  ];
  for (const e of enrollments) {
    const ref = await db.collection("enrollments").add(e);
    console.log(`  + enrollment (${ref.id})`);
  }

  console.log("\nSeed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
