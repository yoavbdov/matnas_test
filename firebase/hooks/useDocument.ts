/*
  FIRESTORE SINGLE DOCUMENT HOOK — reads one document in real time.
  Used when you need details for a specific item (e.g. open a detail modal).

  Usage: useDocument<Class>("classes", classId)
  Returns: { data: Class | null, loading: boolean, error: string | null }

  How it works:
  - On mount: open a real-time listener on the specific doc
  - Updates live if the doc changes while the modal is open
  - On unmount: close the listener
*/
