export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  dob: string; // YYYY-MM-DD
  israeli_id?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  // Computed from enrollments / tournaments / league membership — never set manually
  status?: "פעיל" | "ליגה בלבד" | "לא פעיל";
  israeli_chess_id?: string;
  fide_id?: string;
  israeli_rating?: number;
  fide_rating?: number;
  chess_title?: string;
  grade_override?: string; // manual כיתה override (overrides auto-computed grade)
  created_at?: string;
}

export interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  certifications?: string[];
  notes?: string;
  // Computed from classes / tournaments — never set manually
  status?: "פעיל" | "לא פעיל";
}

export interface Room {
  id: string;
  name: string;
  number?: string;
  capacity: number;
  features?: string[];
  notes?: string;
}

export interface PhysicalEquipment {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

// How many units of a piece of equipment an event (class/tournament) needs
export interface ResourceAssignment {
  resource_id: string;
  quantity: number;
}

export interface ScheduleSlot {
  id: string;
  day: string; // ראשון–שבת
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  room_id: string;
  recurrence: string; // חד פעמי | יומי | שבועי | פעם בשבועיים | פעם בשלושה שבועות | פעם בחודש
  start_date: string; // YYYY-MM-DD
  end_date_override?: string; // YYYY-MM-DD
  once_date?: string; // YYYY-MM-DD — used when recurrence = חד פעמי
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  teacher_id: string;
  capacity: number;
  age_min?: number;
  age_max?: number;
  rating_min?: number;
  rating_max?: number;
  // Status is computed automatically from slot dates (like tournaments)
  status: "מתוכנן" | "פעיל" | "הסתיים" | "בוטל";
  color?: string;
  slots: ScheduleSlot[];
  resource_assignments?: ResourceAssignment[]; // equipment needed for each session
  cancelled_dates?: string[]; // YYYY-MM-DD dates where a session was manually cancelled
  notes?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrolled_at: string;
  status: "פעיל" | "לא פעיל";
}

// --- Tournaments ---

/** A single round within a tournament (specific date + time) */
export interface TournamentRound {
  id: string;
  round_number: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  location?: string; // optional venue / room name
  notes?: string;
  resource_assignments?: ResourceAssignment[]; // equipment needed for this round
}

/** A non-student participant added manually (e.g. external player) */
export interface ManualParticipant {
  id: string; // local UUID
  name: string;
  rating?: number;
  notes?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  status: "מתוכנן" | "פעיל" | "הסתיים" | "בוטל";
  rating_min?: number; // eligibility rating range
  rating_max?: number;
  age_min?: number; // eligibility age range (years, inclusive)
  age_max?: number;
  is_recurring?: boolean; // recurring tournament — no fixed rounds
  // Used only when is_recurring=true (replaces rounds)
  recurring_date?: string;         // YYYY-MM-DD
  recurring_start_time?: string;   // HH:MM
  recurring_end_time?: string;     // HH:MM
  recurring_resource_assignments?: ResourceAssignment[]; // equipment for recurring tournaments
  resource_assignments?: ResourceAssignment[]; // equipment for the whole tournament (set in Details tab)
  room?: string; // the room / hall where the tournament is held
  judge_id?: string; // teacher ID of the referee/arbiter for this tournament
  rounds: TournamentRound[];
  participant_ids: string[]; // student IDs registered in this tournament
  manual_participants: ManualParticipant[]; // externally added players
  color?: string; // display color in calendar
  notes?: string;
  cancelled_dates?: string[]; // YYYY-MM-DD dates where a recurring occurrence was manually cancelled
  created_at?: string;
}

// --- League Groups ---

/** A league group (e.g. "קבוצת ליגה א'") that students can be assigned to */
// Which player category this group belongs to
export type LeagueCategory = "בוגרים" | "נוער" | "נשים";

// League divisions by category:
//   בוגרים: ג | ב | א | ארצית | לאומית
//   נוער:   מחוזית | ארצית | לאומית
//   נשים:   ארצית | עילית
export type LeagueType =
  | "ג"
  | "ב"
  | "א"
  | "ארצית"
  | "לאומית"
  | "מחוזית"
  | "עילית";

export interface LeagueGroup {
  id: string;
  name: string;
  category: LeagueCategory;   // בוגרים / נוער / נשים
  leagueType: LeagueType;     // tier within that category
  description?: string;
  status: "פעיל" | "לא פעיל";
  color?: string;
  notes?: string;
  created_at?: string;
}

/** A single student membership in a league group */
export interface LeagueGroupMember {
  id: string;
  group_id: string;
  student_id: string;
  joined_at: string; // YYYY-MM-DD
}

// --- Attendance ---

/** One student's attendance status for a specific session */
export interface AttendanceRecord {
  student_id: string;
  present: boolean;
  note?: string; // optional free-text note (e.g. "arrived late", "sick")
}

/** All attendance data for one class session (specific date) */
export interface Attendance {
  id: string;
  class_id: string;
  date: string; // YYYY-MM-DD
  records: AttendanceRecord[];
  created_at: string;
}

// --- Events ---

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

export interface AppSettings {
  MAX_STRING_LENGTH?: number;
  MAX_NOTE_LENGTH?: number;
  MAX_SEARCH_LENGTH?: number;
  MAX_INT_INPUT?: number;
  MAX_AGE?: number;
  MAX_ROOM_CAPACITY?: number;
  ID_NUMBER_LENGTH?: number;
  MAX_TAG_LENGTH?: number;
  MAX_TAGS_PER_FIELD?: number;
  MAX_PHONE_LENGTH?: number;
  DATE_PAST_YEARS?: number;
  DATE_FUTURE_YEARS?: number;
  GRADE_FIRST_AGE?: number;
  GRADE_ADULT_AGE?: number;
  DEFAULT_AGE_MIN?: number;
  DEFAULT_AGE_MAX?: number;
  CLASS_NEAR_FULL_THRESHOLD?: number;
}
