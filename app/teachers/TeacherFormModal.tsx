/*
  TEACHER FORM MODAL — add or edit a teacher.

  Props: teacher (null = add), onClose, onSaved

  Fields:
  - שם פרטי     (required, maxLength MAX_STRING_LENGTH)
  - שם משפחה    (required, maxLength MAX_STRING_LENGTH)
                 checks that full name isn't a duplicate
  - טלפון        (maxLength MAX_PHONE_LENGTH)
  - תחום         (maxLength MAX_STRING_LENGTH)
  - הסמכות       (TagInput: maxTags, maxTagLength)

  Saves with addDocument or updateDocument.
*/
