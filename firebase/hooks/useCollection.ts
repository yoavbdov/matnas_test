/*
  FIRESTORE COLLECTION HOOK — reads a whole collection in real time.
  Generic: works for students, classes, teachers, rooms, etc.

  Usage: useCollection<Child>("students")
  Returns: { data: Child[], loading: boolean, error: string | null }

  How it works:
  - On mount: open a real-time Firestore listener on the named collection
  - Whenever Firestore changes (add/edit/delete): update data automatically
  - On unmount: close the listener (cleanup to avoid memory leaks)

  This means the UI always shows fresh data without manual refresh.
*/
