/*
  FIRESTORE WRITE OPERATIONS — all the "save / update / delete" functions.
  Components call these in event handlers (button clicks, form submits).
  Reading is handled separately by hooks — this file is write-only.

  Functions (one per action, very simple):
  - addDocument(collection, data)         → create new doc, return its ID
  - updateDocument(collection, id, data)  → update fields on existing doc
  - deleteDocument(collection, id)        → delete a doc by ID
  - deleteWhere(collection, field, value) → delete all docs matching a filter
                                            (used to clean up enrollments when
                                            a student or class is deleted)

  All functions are async, throw on error so the caller can show a toast.
*/
