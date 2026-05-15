// Types for tracking student attendance in class sessions

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
