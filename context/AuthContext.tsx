/*
  AUTH CONTEXT — makes the logged-in user available to the whole app.

  Wraps the app in a React context that provides: { user, loading }
  Uses useAuth hook internally.

  Also exports a helper: useAuthContext() — any component calls this
  instead of useContext(AuthContext) directly.

  Why: so every page/component can easily check "is someone logged in?"
  without prop drilling or repeating Firebase calls.
*/
