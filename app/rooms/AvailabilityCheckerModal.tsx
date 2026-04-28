/*
  AVAILABILITY CHECKER MODAL — check if a resource is available in a date range.

  User picks:
  - Which resource (dropdown)
  - Date range (start + end)

  System shows:
  - Which classes use this resource during that date range
  - Peak simultaneous usage (calculated by calcResourceAvailability from classHelpers)
  - Green if total available ≥ peak usage
  - Red if there's a shortage (shows the deficit: "חסרות 3 יחידות")
*/
