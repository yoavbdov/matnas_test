// Types for league groups and student memberships

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

/** A league group (e.g. "קבוצת ליגה א'") that students can be assigned to */
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
