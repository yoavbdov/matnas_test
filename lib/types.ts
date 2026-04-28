/*
  ALL TYPESCRIPT TYPES FOR THE ENTIRE APP
  Every shape of data that moves around — define it here once, use everywhere.

  Types defined here:
  - Child         : a student (name, dob, israeli ID, contact, chess ratings, status)
  - Teacher       : teacher (name, phone, subject, certifications)
  - Room          : a physical room (name, number, capacity, features list)
  - Resource      : equipment/items (name, type, quantity, min required)
  - Class         : a course (name, teacher, age range, capacity, schedule slots, resources)
  - ScheduleSlot  : one time block inside a class (day, start, end, room, recurrence)
  - Enrollment    : links a child to a class
  - CustomEventType : user-defined event label
  - AppSettings   : configurable limits stored in Firestore (max string length, etc.)

  Nothing else. No logic here, just shapes.
*/
