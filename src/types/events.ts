// Types for calendar events (not classes or tournaments)

/**
 * An event is like a tournament but has no equipment, no instructor, and no participants.
 * It can be one-time (single date) or recurring (weekly pattern of days).
 */
export interface Event {
  id: string;
  name: string;
  description?: string;
  color?: string;
  notes?: string;

  // "חד פעמי" = single date, "חוזר" = weekly repeating pattern
  recurrence_type: "חד פעמי" | "חוזר";

  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  room: string;       // room name (free text, like tournaments)

  // --- One-time only ---
  date?: string; // YYYY-MM-DD

  // --- Recurring only ---
  days_of_week?: string[];  // Hebrew day names, e.g. ["ראשון", "שלישי"]
  start_date?: string;      // YYYY-MM-DD — when the recurrence begins
  is_permanent?: boolean;   // if true, recurs forever (end_date is ignored)
  end_date?: string;        // YYYY-MM-DD — last date (only used if !is_permanent)
  cancelled_dates?: string[]; // YYYY-MM-DD dates where a recurring occurrence was manually cancelled

  created_at?: string;
}
