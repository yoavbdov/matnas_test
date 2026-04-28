/*
  CHILD FORM MODAL — add a new student or edit an existing one.

  Props:
  - child    : Child | null (null = add mode, object = edit mode)
  - onClose  : close the modal
  - onSaved  : called after successful save (triggers a toast in parent)

  Form fields:
  - שם פרטי          (required, letters only, maxLength MAX_STRING_LENGTH)
  - שם משפחה         (required, letters only, maxLength MAX_STRING_LENGTH)
  - מגדר             (radio: זכר / נקבה)
  - תאריך לידה       (date picker; auto-shows grade below field)
  - תעודת זהות       (exactly 9 digits, must be unique — checked against Firestore)
  - שם איש קשר      (maxLength MAX_STRING_LENGTH)
  - טלפון איש קשר   (10 digits, must start with 05)
  - הערות            (textarea, maxLength MAX_NOTE_LENGTH)
  - סטטוס            (dropdown — edit mode only)
  - דירוג ישראלי     (read-only, filled by sync; can be manually overridden)
  - דירוג FIDE       (read-only, filled by sync; can be manually overridden)
  - מזהה שחמט ישראלי (number — used to match this student in the monthly sync)
  - מזהה FIDE        (number — used to match in FIDE sync)
  - תואר שחמטאי      (dropdown: GM, IM, FM, CM, NM, WGM, WIM, WFM, WCM, or none)

  Validation runs on submit, shows inline error messages per field.
  On save: calls addDocument or updateDocument from firestore.ts.
*/
