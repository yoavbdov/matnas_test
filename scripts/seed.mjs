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
  const COLLECTIONS = ["instructors", "rooms", "physicalEquipment", "classes", "students", "enrollments", "competitions"];

  console.log("Clearing existing data...");
  for (const col of COLLECTIONS) await clearCollection(col);

  // ── INSTRUCTORS (מדריכים) ──────────────────────────────────────────────────
  console.log("\nSeeding instructors...");
  const instructors = [
    {
      firstName: "יוסי",
      lastName: "כהן",
      dob: "1980-05-14",
      israeliRating: 2250,
      israeliId: 50001,
      fideRating: 2180,
      fideId: 60001,
      gender: "זכר",
      internationalTitle: "FM",
      nationalId: "011111111",
      phone: "050-1234567",
    },
    {
      firstName: "מירב",
      lastName: "לוי",
      dob: "1985-09-20",
      israeliRating: 1900,
      israeliId: 50002,
      fideRating: 1840,
      fideId: 60002,
      gender: "נקבה",
      internationalTitle: null,
      nationalId: "022222222",
      phone: "052-2345678",
    },
    {
      firstName: "אמיר",
      lastName: "ביטון",
      dob: "1978-03-08",
      israeliRating: 2400,
      israeliId: 50003,
      fideRating: 2350,
      fideId: 60003,
      gender: "זכר",
      internationalTitle: "IM",
      nationalId: "033333333",
      phone: "054-3456789",
    },
    {
      firstName: "רחל",
      lastName: "אזולאי",
      dob: "1990-12-01",
      israeliRating: 1700,
      israeliId: 50004,
      fideRating: null,
      fideId: null,
      gender: "נקבה",
      internationalTitle: null,
      nationalId: "044444444",
      phone: "053-4567890",
    },
  ];
  const instructorIds = {};
  for (const inst of instructors) {
    const ref = await db.collection("instructors").add(inst);
    instructorIds[`${inst.firstName} ${inst.lastName}`] = ref.id;
    console.log(`  + ${inst.firstName} ${inst.lastName} (${ref.id})`);
  }

  // ── ROOMS (חדרים) ──────────────────────────────────────────────────────────
  console.log("\nSeeding rooms...");
  const rooms = [
    {
      name: "חדר שחמט קטן",
      maxCapacity: 15,
      // { equipmentName: quantity } — equipment stored in this room
      storesEquipment: { "לוחות שחמט": 20, "שעוני שחמט": 15 },
    },
    {
      name: "חדר שחמט גדול",
      maxCapacity: 40,
      storesEquipment: { "לוחות שחמט": 30, "שעוני שחמט": 15, "כיסאות מתקפלים": 40 },
    },
    {
      name: "חדר מחשבים",
      maxCapacity: 20,
      storesEquipment: {},
    },
    {
      name: "אולם תחרויות",
      maxCapacity: 60,
      storesEquipment: { "שעוני DGT": 20, "לוחות DGT": 30 },
    },
  ];
  const roomIds = {};
  for (const r of rooms) {
    const ref = await db.collection("rooms").add(r);
    roomIds[r.name] = ref.id;
    console.log(`  + ${r.name} (${ref.id})`);
  }

  // ── PHYSICAL EQUIPMENT (ציוד פיזי) ────────────────────────────────────────
  console.log("\nSeeding physicalEquipment...");
  const physicalEquipment = [
    { name: "לוחות שחמט",      quantity: 50, storageLocation: "חדר שחמט קטן" },
    { name: "שעוני שחמט",      quantity: 30, storageLocation: "חדר שחמט קטן" },
    { name: "שעוני DGT",       quantity: 20, storageLocation: "אולם תחרויות" },
    { name: "לוחות DGT",       quantity: 30, storageLocation: "אולם תחרויות" },
    { name: "כיסאות מתקפלים",  quantity: 40, storageLocation: "חדר שחמט גדול" },
  ];
  for (const eq of physicalEquipment) {
    const ref = await db.collection("physicalEquipment").add(eq);
    console.log(`  + ${eq.name} (${ref.id})`);
  }

  // ── CLASSES (חוגים) ────────────────────────────────────────────────────────
  console.log("\nSeeding classes...");
  const classesData = [
    {
      name: "שחמט מתחילים",
      maxCapacity: 15,
      ratingRange: { min: 0, max: 1200 },
      ageRange: { min: 6, max: 10 },
      instructorId: instructorIds["יוסי כהן"],
      scheduleSlots: [
        { day: "ראשון",  startTime: "16:00", endTime: "17:00", roomId: roomIds["חדר שחמט קטן"],  recurrence: "שבועי" },
        { day: "שלישי", startTime: "16:00", endTime: "17:00", roomId: roomIds["חדר שחמט קטן"],  recurrence: "שבועי" },
      ],
      isActive: true,
    },
    {
      name: "שחמט מתקדמים",
      maxCapacity: 20,
      ratingRange: { min: 1200, max: 2000 },
      ageRange: { min: 10, max: 18 },
      instructorId: instructorIds["מירב לוי"],
      scheduleSlots: [
        { day: "שני",   startTime: "17:00", endTime: "19:00", roomId: roomIds["חדר שחמט גדול"], recurrence: "שבועי" },
        { day: "רביעי", startTime: "17:00", endTime: "19:00", roomId: roomIds["חדר שחמט גדול"], recurrence: "שבועי" },
      ],
      isActive: true,
    },
    {
      name: "אימון קבוצתי",
      maxCapacity: 20,
      ratingRange: { min: 1500, max: 2500 },
      ageRange: { min: 12, max: 18 },
      instructorId: instructorIds["אמיר ביטון"],
      scheduleSlots: [
        { day: "חמישי", startTime: "16:00", endTime: "18:00", roomId: roomIds["אולם תחרויות"],  recurrence: "שבועי" },
      ],
      isActive: true,
    },
    {
      name: "שחמט מחשב",
      maxCapacity: 20,
      ratingRange: { min: 0, max: 1500 },
      ageRange: { min: 8, max: 16 },
      instructorId: instructorIds["רחל אזולאי"],
      scheduleSlots: [
        { day: "שלישי", startTime: "15:00", endTime: "16:30", roomId: roomIds["חדר מחשבים"],   recurrence: "שבועי" },
      ],
      isActive: true,
    },
    {
      name: "מועדון בוגרים",
      maxCapacity: 30,
      ratingRange: { min: 1800, max: 3000 },
      ageRange: { min: 18, max: 99 },
      instructorId: instructorIds["יוסי כהן"],
      scheduleSlots: [
        { day: "שישי",  startTime: "10:00", endTime: "13:00", roomId: roomIds["חדר שחמט גדול"], recurrence: "שבועי" },
      ],
      isActive: true,
    },
  ];
  const classIds = {};
  for (const c of classesData) {
    const ref = await db.collection("classes").add(c);
    classIds[c.name] = ref.id;
    console.log(`  + ${c.name} (${ref.id})`);
  }

  // ── STUDENTS (שחקנים) ──────────────────────────────────────────────────────
  console.log("\nSeeding students...");
  const students = [
    {
      firstName: "נועם",  lastName: "כץ",
      dob: "2013-03-15",  gender: "זכר",
      israeliRating: 850,  israeliId: 10001,
      fideRating: null,    fideId: null,
      internationalTitle: null,
      nationalId: "311111111",
      phone: "050-1111111",
      contactPerson: "דני כץ",
      homeClub: "מכבי תל אביב",
      notes: "",
      isActive: true,
      registeredSiblings: [],
    },
    {
      firstName: "שיר",   lastName: "מזרחי",
      dob: "2011-07-22",  gender: "נקבה",
      israeliRating: 1350, israeliId: 10002,
      fideRating: 1280,    fideId: 20002,
      internationalTitle: null,
      nationalId: "322222222",
      phone: "052-2222222",
      contactPerson: "רות מזרחי",
      homeClub: "הפועל ירושלים",
      notes: "",
      isActive: true,
      registeredSiblings: [],
    },
    {
      firstName: "עידן",  lastName: "פרץ",
      dob: "2012-01-10",  gender: "זכר",
      israeliRating: 1100, israeliId: 10003,
      fideRating: null,    fideId: null,
      internationalTitle: null,
      nationalId: "333333333",
      phone: "054-3333333",
      contactPerson: "יעל פרץ",
      homeClub: "מכבי חיפה",
      notes: "מתחיל לשחק תחרויות השנה",
      isActive: true,
      registeredSiblings: [],
    },
    {
      firstName: "מיה",   lastName: "שפירא",
      dob: "2010-09-05",  gender: "נקבה",
      israeliRating: 1650, israeliId: 10004,
      fideRating: 1590,    fideId: 20004,
      internationalTitle: null,
      nationalId: "344444444",
      phone: "053-4444444",
      contactPerson: "אבי שפירא",
      homeClub: "הפועל תל אביב",
      notes: "",
      isActive: true,
      registeredSiblings: [],
    },
    {
      firstName: "אורי",  lastName: "גולן",
      dob: "2014-06-18",  gender: "זכר",
      israeliRating: 600,  israeliId: 10005,
      fideRating: null,    fideId: null,
      internationalTitle: null,
      nationalId: "355555555",
      phone: "050-5555555",
      contactPerson: "לילה גולן",
      homeClub: "",
      notes: "אח של נטע גולן",
      isActive: true,
      registeredSiblings: [],
    },
    {
      firstName: "תמר",   lastName: "אברהם",
      dob: "2009-11-30",  gender: "נקבה",
      israeliRating: 1900, israeliId: 10006,
      fideRating: 1830,    fideId: 20006,
      internationalTitle: "FM",
      nationalId: "366666666",
      phone: "052-6666666",
      contactPerson: "משה אברהם",
      homeClub: "מכבי תל אביב",
      notes: "",
      isActive: true,
      registeredSiblings: [],
    },
    {
      firstName: "יובל",  lastName: "דוד",
      dob: "2013-04-25",  gender: "זכר",
      israeliRating: 750,  israeliId: 10007,
      fideRating: null,    fideId: null,
      internationalTitle: null,
      nationalId: "377777777",
      phone: "054-7777777",
      contactPerson: "נחמה דוד",
      homeClub: "",
      notes: "",
      isActive: true,
      registeredSiblings: [],
    },
    {
      firstName: "ליאור", lastName: "ברק",
      dob: "2011-02-14",  gender: "זכר",
      israeliRating: 1450, israeliId: 10008,
      fideRating: 1380,    fideId: 20008,
      internationalTitle: null,
      nationalId: "388888888",
      phone: "053-8888888",
      contactPerson: "שרה ברק",
      homeClub: "הפועל חיפה",
      notes: "",
      isActive: true,
      registeredSiblings: [],
    },
    {
      firstName: "נטע",   lastName: "חיים",
      dob: "2012-08-07",  gender: "נקבה",
      israeliRating: 980,  israeliId: 10009,
      fideRating: null,    fideId: null,
      internationalTitle: null,
      nationalId: "399999999",
      phone: "050-9999999",
      contactPerson: "יצחק חיים",
      homeClub: "",
      notes: "",
      isActive: true,
      registeredSiblings: [],
    },
    {
      firstName: "רון",   lastName: "סעדון",
      dob: "2010-05-12",  gender: "זכר",
      israeliRating: 1750, israeliId: 10010,
      fideRating: 1680,    fideId: 20010,
      internationalTitle: null,
      nationalId: "300000001",
      phone: "052-0000001",
      contactPerson: "פנינה סעדון",
      homeClub: "הפועל ירושלים",
      notes: "",
      isActive: true,
      registeredSiblings: [],
    },
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
    { studentId: studentIds["נועם כץ"],    classId: classIds["שחמט מתחילים"], enrolledAt: now },
    { studentId: studentIds["אורי גולן"],  classId: classIds["שחמט מתחילים"], enrolledAt: now },
    { studentId: studentIds["יובל דוד"],   classId: classIds["שחמט מתחילים"], enrolledAt: now },
    { studentId: studentIds["נטע חיים"],   classId: classIds["שחמט מתחילים"], enrolledAt: now },
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

  // ── COMPETITIONS (תחרויות) ─────────────────────────────────────────────────
  console.log("\nSeeding competitions...");
  const competitions = [
    {
      name: "אליפות בית הספר 2026",
      ratingRange: { min: 0, max: 1500 },
      ageRange: { min: 8, max: 18 },
      maxParticipants: 32,
      arbiterId: instructorIds["אמיר ביטון"],
      scheduleSlots: [
        { day: "שישי", startTime: "09:00", endTime: "14:00", roomId: roomIds["אולם תחרויות"], recurrence: "חד פעמי" },
      ],
      format: "שוויצרי",
      timeControl: "15+10",
      rounds: 7,
      registeredPlayers: [
        studentIds["נועם כץ"],
        studentIds["אורי גולן"],
        studentIds["יובל דוד"],
        studentIds["נטע חיים"],
        studentIds["עידן פרץ"],
      ],
      isActive: true,
    },
    {
      name: "תחרות מהירה — מתקדמים",
      ratingRange: { min: 1200, max: 2200 },
      ageRange: { min: 10, max: 99 },
      maxParticipants: 16,
      arbiterId: instructorIds["אמיר ביטון"],
      scheduleSlots: [
        { day: "שבת", startTime: "10:00", endTime: "16:00", roomId: roomIds["אולם תחרויות"], recurrence: "חד פעמי" },
      ],
      format: "שוויצרי",
      timeControl: "5+3",
      rounds: 5,
      registeredPlayers: [
        studentIds["שיר מזרחי"],
        studentIds["מיה שפירא"],
        studentIds["ליאור ברק"],
        studentIds["תמר אברהם"],
        studentIds["רון סעדון"],
      ],
      isActive: true,
    },
  ];
  for (const comp of competitions) {
    const ref = await db.collection("competitions").add(comp);
    console.log(`  + ${comp.name} (${ref.id})`);
  }

  console.log("\nSeed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
