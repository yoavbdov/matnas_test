export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  dob: string; // YYYY-MM-DD
  israeli_id?: string;
  phone?: string;
  parent_name?: string;
  parent_phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  status: "פעיל" | "לא פעיל";
  israeli_chess_id?: string;
  fide_id?: string;
  israeli_rating?: number;
  fide_rating?: number;
  chess_title?: string;
  created_at?: string;
}

export interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  subject?: string;
  certifications?: string[];
  notes?: string;
  status: "פעיל" | "לא פעיל";
}

export interface Room {
  id: string;
  name: string;
  number?: string;
  capacity: number;
  features?: string[];
  notes?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  quantity: number;
  min_required?: number;
  notes?: string;
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
  teacher_id: string;
  capacity: number;
  age_min?: number;
  age_max?: number;
  rating_min?: number;
  rating_max?: number;
  status: "פעיל" | "לא פעיל";
  color?: string;
  slots: ScheduleSlot[];
  resource_ids?: string[];
  notes?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrolled_at: string;
  status: "פעיל" | "לא פעיל";
}

export interface CustomEventType {
  id: string;
  name: string;
  color?: string;
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
