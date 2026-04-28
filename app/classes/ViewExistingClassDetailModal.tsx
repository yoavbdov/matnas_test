/*
  // החלון שנפתח כשלוחצים על חוג קיים — מציג את כל פרטיו: מועדים, ציוד, ורשימת התלמידים הרשומים אליו.
  CLASS DETAIL MODAL — full detail view of an existing class.

  Props: classItem, onClose, onEdit, onDelete

  Sections:
  1. Basic info: name, teacher, age range, rating range, capacity, end date, status(active/inactive)
  2. Schedule slots: list of all slots with their times, rooms, and recurrence
     - Any conflicts shown with a red marker
  3. Resources: list of needed resources with quantities
  4. Enrolled students: table of students (name, grade, rating)
     - Each row has "הסר רישום" button

  Edit button → opens ClassFormModal prefilled
  Delete button → ConfirmDialog → deletes class + all its enrollments
*/
