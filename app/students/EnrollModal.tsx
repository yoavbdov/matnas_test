/*
  ENROLL MODAL — enroll a student in one or more classes.

  Props:
  - child       : the student being enrolled
  - allClasses  : all classes (to show eligible + ineligible)
  - enrollments : existing enrollments (to avoid re-enrolling)
  - onClose     : close the modal
  - onSaved     : called after saving

  Layout:
  - List of all classes
    → eligible (age in range, not full, not already enrolled): checkbox + details
    → ineligible: shown grayed out with reason (צעיר מדי / מבוגר מדי / מלא / כבר רשום)

  - On save: create one Enrollment doc per checked class in Firestore
*/
