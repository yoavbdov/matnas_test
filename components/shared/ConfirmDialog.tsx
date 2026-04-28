/*
  CONFIRM DIALOG — a small modal that asks "are you sure?" before a destructive action.

  Props:
  - message  : what are we confirming? e.g. "למחוק את התלמיד הזה?"
  - onConfirm: called if user clicks "כן, מחק"
  - onCancel : called if user clicks "ביטול" or presses Escape

  Used before: deleting a student, deleting a class, deleting a teacher.
  Prevents accidental deletions.
*/
