/*
  SEED SCRIPT — populates Firestore with chess-relevant demo data for development.
  Run once: node scripts/seed.mjs

  Collections created:

  teacherS (מדריכים, 4):
  - יוסי כהן   — FM, israeliRating 2250, fideRating 2180
  - מירב לוי   — israeliRating 1900, fideRating 1840
  - אמיר ביטון — IM, israeliRating 2400, fideRating 2350 (משמש גם כשופט בתחרויות)
  - רחל אזולאי — israeliRating 1700

  ROOMS (חדרים, 4):
  - חדר שחמט קטן   (maxCapacity 15, storesEquipment: לוחות+שעוני שחמט)
  - חדר שחמט גדול  (maxCapacity 40, storesEquipment: לוחות+שעוני שחמט+כיסאות)
  - חדר מחשבים     (maxCapacity 20, storesEquipment: {})
  - אולם תחרויות    (maxCapacity 60, storesEquipment: שעוני DGT+לוחות DGT)

  PHYSICAL EQUIPMENT (ציוד פיזי, 5):
  - לוחות שחמט      (quantity 50, storageLocation: חדר שחמט קטן)
  - שעוני שחמט      (quantity 30, storageLocation: חדר שחמט קטן)
  - שעוני DGT       (quantity 20, storageLocation: אולם תחרויות)
  - לוחות DGT       (quantity 30, storageLocation: אולם תחרויות)
  - כיסאות מתקפלים  (quantity 40, storageLocation: חדר שחמט גדול)

  CLASSES (חוגים, 5):
  - שחמט מתחילים  — יוסי, age 6–10,  rating 0–1200,    ראשון+שלישי 16:00–17:00
  - שחמט מתקדמים  — מירב, age 10–18, rating 1200–2000,  שני+רביעי 17:00–19:00
  - אימון קבוצתי  — אמיר, age 12–18, rating 1500–2500,  חמישי 16:00–18:00
  - שחמט מחשב     — רחל,  age 8–16,  rating 0–1500,     שלישי 15:00–16:30
  - מועדון בוגרים — יוסי, age 18+,   rating 1800–3000,  שישי 10:00–13:00

  STUDENTS (שחקנים, 10): varied ages 8–17, Israeli+FIDE IDs, ratings, contactPerson, homeClub
  ENROLLMENTS: students distributed across classes
  COMPETITIONS (תחרויות, 2): אליפות בית הספר 2026, תחרות מהירה — מתקדמים
*/
