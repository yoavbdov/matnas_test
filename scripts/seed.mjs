// Run: node scripts/seed.mjs
// Seeds Firestore with demo data for the chess school management system.
// Requires firebase-admin-sdk.json in the project root (git-ignored).

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
  const COLLECTIONS = ["teachers", "rooms", "resources", "classes", "students", "enrollments"];

  console.log("Clearing existing data...");
  for (const col of COLLECTIONS) await clearCollection(col);

  // ── TEACHERS ──────────────────────────────────────────────────────────────
  console.log("\nSeeding teachers...");
  const teachers = [
    { firstName: "יוסי",  lastName: "כהן",    phone: "050-1234567", subject: "אימון שחמט",    certifications: ["FIDE Trainer", "National Coach"] },
    { firstName: "מירב",  lastName: "לוי",    phone: "052-2345678", subject: "שחמט מתחילים", certifications: ["FIDE Instructor"] },
    { firstName: "אמיר",  lastName: "ביטון",  phone: "054-3456789", subject: "תחרויות",       certifications: ["Arbiter", "Tournament Director"] },
    { firstName: "רחל",   lastName: "אזולאי", phone: "053-4567890", subject: "שחמט נוער",     certifications: ["School Chess Coach"] },
  ];
  const teacherIds = {};
  for (const t of teachers) {
    const ref = await db.collection("teachers").add(t);
    teacherIds[`${t.firstName} ${t.lastName}`] = ref.id;
    console.log(`  + ${t.firstName} ${t.lastName} (${ref.id})`);
  }

  // ── ROOMS ─────────────────────────────────────────────────────────────────
  console.log("\nSeeding rooms...");
  const rooms = [
    { name: "חדר שחמט קטן",  number: "101", capacity: 15, features: ["לוחות", "שעוני שחמט"] },
    { name: "חדר שחמט גדול", number: "102", capacity: 40, features: ["לוחות", "שעוני שחמט", "מקרן"] },
    { name: "חדר מחשבים",    number: "103", capacity: 20, features: ["מחשבים", "אינטרנט"] },
    { name: "אולם תחרויות",   number: "104", capacity: 60, features: ["לוחות DGT", "שעוני DGT", "מצלמות"] },
  ];
  const roomIds = {};
  for (const r of rooms) {
    const ref = await db.collection("rooms").add(r);
    roomIds[r.name] = ref.id;
    console.log(`  + ${r.name} (${ref.id})`);
  }

  // ── RESOURCES ─────────────────────────────────────────────────────────────
  console.log("\nSeeding resources...");
  const resources = [
    { name: "לוחות שחמט",   type: "ציוד", quantity: 50, minRequired: 20 },
    { name: "שעוני שחמט",   type: "ציוד", quantity: 30, minRequired: 15 },
    { name: "שעוני DGT",    type: "ציוד", quantity: 20, minRequired: 10 },
    { name: "כסאות נוספים", type: "ציוד", quantity: 40, minRequired: 0  },
  ];
  for (const r of resources) {
    const ref = await db.collection("resources").add(r);
    console.log(`  + ${r.name} (${ref.id})`);
  }

  // ── CLASSES ───────────────────────────────────────────────────────────────
  console.log("\nSeeding classes...");
  const classesData = [
    {
      name: "שחמט מתחילים",
      teacherId: teacherIds["יוסי כהן"],
      teacherName: "יוסי כהן",
      minAge: 6, maxAge: 10,
      minRating: 0, maxRating: 1200,
      capacity: 15,
      scheduleSlots: [
        { day: "ראשון",  startTime: "16:00", endTime: "17:00", roomId: roomIds["חדר שחמט קטן"],  recurrence: "שבועי" },
        { day: "שלישי", startTime: "16:00", endTime: "17:00", roomId: roomIds["חדר שחמט קטן"],  recurrence: "שבועי" },
      ],
    },
    {
      name: "שחמט מתקדמים",
      teacherId: teacherIds["מירב לוי"],
      teacherName: "מירב לוי",
      minAge: 10, maxAge: 18,
      minRating: 1200, maxRating: 2000,
      capacity: 20,
      scheduleSlots: [
        { day: "שני",   startTime: "17:00", endTime: "19:00", roomId: roomIds["חדר שחמט גדול"], recurrence: "שבועי" },
        { day: "רביעי", startTime: "17:00", endTime: "19:00", roomId: roomIds["חדר שחמט גדול"], recurrence: "שבועי" },
      ],
    },
    {
      name: "אימון קבוצתי",
      teacherId: teacherIds["אמיר ביטון"],
      teacherName: "אמיר ביטון",
      minAge: 12, maxAge: 18,
      minRating: 1500, maxRating: 2500,
      capacity: 20,
      scheduleSlots: [
        { day: "חמישי", startTime: "16:00", endTime: "18:00", roomId: roomIds["אולם תחרויות"],   recurrence: "שבועי" },
      ],
    },
    {
      name: "שחמט מחשב",
      teacherId: teacherIds["רחל אזולאי"],
      teacherName: "רחל אזולאי",
      minAge: 8, maxAge: 16,
      minRating: 0, maxRating: 1500,
      capacity: 20,
      scheduleSlots: [
        { day: "שלישי", startTime: "15:00", endTime: "16:30", roomId: roomIds["חדר מחשבים"],    recurrence: "שבועי" },
      ],
    },
    {
      name: "מועדון בוגרים",
      teacherId: teacherIds["יוסי כהן"],
      teacherName: "יוסי כהן",
      minAge: 18, maxAge: 99,
      minRating: 1800, maxRating: 3000,
      capacity: 30,
      scheduleSlots: [
        { day: "שישי",  startTime: "10:00", endTime: "13:00", roomId: roomIds["חדר שחמט גדול"], recurrence: "שבועי" },
      ],
    },
  ];
  const classIds = {};
  for (const c of classesData) {
    const ref = await db.collection("classes").add(c);
    classIds[c.name] = ref.id;
    console.log(`  + ${c.name} (${ref.id})`);
  }

  // ── STUDENTS ──────────────────────────────────────────────────────────────
  console.log("\nSeeding students...");
  const students = [
    { firstName: "נועם",  lastName: "כץ",     dob: "2013-03-15", gender: "זכר",  idNumber: "311111111", contactName: "דני כץ",      contactPhone: "050-1111111", israeliRating: 850,  fideRating: null, israeliId: 10001, fideId: null,  chessTitle: null, status: "פעיל" },
    { firstName: "שיר",   lastName: "מזרחי",  dob: "2011-07-22", gender: "נקבה", idNumber: "322222222", contactName: "רות מזרחי",   contactPhone: "052-2222222", israeliRating: 1350, fideRating: 1280, israeliId: 10002, fideId: 20002, chessTitle: null, status: "פעיל" },
    { firstName: "עידן",  lastName: "פרץ",    dob: "2012-01-10", gender: "זכר",  idNumber: "333333333", contactName: "יעל פרץ",     contactPhone: "054-3333333", israeliRating: 1100, fideRating: null, israeliId: 10003, fideId: null,  chessTitle: null, status: "פעיל" },
    { firstName: "מיה",   lastName: "שפירא",  dob: "2010-09-05", gender: "נקבה", idNumber: "344444444", contactName: "אבי שפירא",   contactPhone: "053-4444444", israeliRating: 1650, fideRating: 1590, israeliId: 10004, fideId: 20004, chessTitle: null, status: "פעיל" },
    { firstName: "אורי",  lastName: "גולן",   dob: "2014-06-18", gender: "זכר",  idNumber: "355555555", contactName: "לילה גולן",   contactPhone: "050-5555555", israeliRating: 600,  fideRating: null, israeliId: 10005, fideId: null,  chessTitle: null, status: "פעיל" },
    { firstName: "תמר",   lastName: "אברהם",  dob: "2009-11-30", gender: "נקבה", idNumber: "366666666", contactName: "משה אברהם",   contactPhone: "052-6666666", israeliRating: 1900, fideRating: 1830, israeliId: 10006, fideId: 20006, chessTitle: "FM", status: "פעיל" },
    { firstName: "יובל",  lastName: "דוד",    dob: "2013-04-25", gender: "זכר",  idNumber: "377777777", contactName: "נחמה דוד",    contactPhone: "054-7777777", israeliRating: 750,  fideRating: null, israeliId: 10007, fideId: null,  chessTitle: null, status: "פעיל" },
    { firstName: "ליאור", lastName: "ברק",    dob: "2011-02-14", gender: "זכר",  idNumber: "388888888", contactName: "שרה ברק",     contactPhone: "053-8888888", israeliRating: 1450, fideRating: 1380, israeliId: 10008, fideId: 20008, chessTitle: null, status: "פעיל" },
    { firstName: "נטע",   lastName: "חיים",   dob: "2012-08-07", gender: "נקבה", idNumber: "399999999", contactName: "יצחק חיים",   contactPhone: "050-9999999", israeliRating: 980,  fideRating: null, israeliId: 10009, fideId: null,  chessTitle: null, status: "פעיל" },
    { firstName: "רון",   lastName: "סעדון",  dob: "2010-05-12", gender: "זכר",  idNumber: "300000001", contactName: "פנינה סעדון",  contactPhone: "052-0000001", israeliRating: 1750, fideRating: 1680, israeliId: 10010, fideId: 20010, chessTitle: null, status: "פעיל" },
  ];
  const studentIds = {};
  for (const s of students) {
    const ref = await db.collection("students").add(s);
    studentIds[`${s.firstName} ${s.lastName}`] = ref.id;
    console.log(`  + ${s.firstName} ${s.lastName} (${ref.id})`);
  }

  // ── ENROLLMENTS ───────────────────────────────────────────────────────────
  console.log("\nSeeding enrollments...");
  const now = new Date().toISOString();
  const enrollments = [
    // שחמט מתחילים (0–1200, age 6–10)
    { studentId: studentIds["נועם כץ"],    classId: classIds["שחמט מתחילים"],  enrolledAt: now },
    { studentId: studentIds["אורי גולן"],  classId: classIds["שחמט מתחילים"],  enrolledAt: now },
    { studentId: studentIds["יובל דוד"],   classId: classIds["שחמט מתחילים"],  enrolledAt: now },
    { studentId: studentIds["נטע חיים"],   classId: classIds["שחמט מתחילים"],  enrolledAt: now },
    // שחמט מתקדמים (1200–2000, age 10–18)
    { studentId: studentIds["שיר מזרחי"],  classId: classIds["שחמט מתקדמים"], enrolledAt: now },
    { studentId: studentIds["עידן פרץ"],   classId: classIds["שחמט מתקדמים"], enrolledAt: now },
    { studentId: studentIds["ליאור ברק"],  classId: classIds["שחמט מתקדמים"], enrolledAt: now },
    // אימון קבוצתי (1500–2500, age 12–18)
    { studentId: studentIds["מיה שפירא"],  classId: classIds["אימון קבוצתי"],  enrolledAt: now },
    { studentId: studentIds["תמר אברהם"],  classId: classIds["אימון קבוצתי"],  enrolledAt: now },
    { studentId: studentIds["רון סעדון"],  classId: classIds["אימון קבוצתי"],  enrolledAt: now },
    // שחמט מחשב (0–1500, age 8–16)
    { studentId: studentIds["נועם כץ"],    classId: classIds["שחמט מחשב"],     enrolledAt: now },
    { studentId: studentIds["עידן פרץ"],   classId: classIds["שחמט מחשב"],     enrolledAt: now },
    { studentId: studentIds["נטע חיים"],   classId: classIds["שחמט מחשב"],     enrolledAt: now },
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
