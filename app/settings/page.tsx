/*
  SETTINGS PAGE — admin can change configurable limits stored in Firestore.

  Shows a form with all AppSettings fields (numeric inputs with min/max):
  - גיל מינימלי ברירת מחדל (0 – MAX_AGE)
  - גיל מקסימלי ברירת מחדל (0 – MAX_AGE)
  - סף "כמעט מלא"           (0.1 – 1.0, step 0.05)
  - קיבולת חדר מקסימלית     (1 – 9999)

  Buttons:
  - "שמור" → writes new values to Firestore "settings" document
  - "איפוס לברירות מחדל" → resets to values from config.ts, writes to Firestore

  Pre-fills from current Firestore settings (via useData context).
*/
