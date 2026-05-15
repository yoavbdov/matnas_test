// Types for people in the system: students and teachers

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
