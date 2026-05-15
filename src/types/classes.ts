// Types for classes, their schedule slots, and student enrollments

import type { ResourceAssignment } from "./resources";

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
