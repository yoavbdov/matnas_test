/*
  AUTH STATE HOOK
  Listens to Firebase for whether a user is logged in or not.

  Returns: { user, loading }
    - user    : the Firebase user object if logged in, null if not
    - loading : true while Firebase is still checking (prevents flash-redirect)

  How it works:
  - On mount: subscribe to Firebase onAuthStateChanged
  - When Firebase fires: update user + set loading to false
  - On unmount: unsubscribe (cleanup)

  Used by: AuthContext (which wraps the whole app)
*/
