/*
  TOAST CONTEXT — shows short success/error messages at the top of the screen.

  Provides: { showToast(message, type) }
    type: "success" | "error"

  How it works:
  - Any component calls showToast("Student saved!", "success")
  - A toast bar appears for 3 seconds then disappears automatically
  - Only one toast at a time

  Exports: useToast() helper — call this in any component to trigger a toast.
*/
