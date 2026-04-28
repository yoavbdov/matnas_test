/*
  DEFAULT VALUES FOR CONFIGURABLE LIMITS.
  These are the hard-coded fallbacks. The real values come from Firestore "settings" doc.
  This file is only used as the default if Firestore hasn't been set yet.

  Values:
  - MAX_STRING_LENGTH  = 15    (names, titles)
  - MAX_NOTE_LENGTH    = 400   (textarea notes)
  - MAX_SEARCH_LENGTH  = 100   (search boxes)
  - MAX_INT_INPUT      = 9999  (any number field)
  - MAX_AGE            = 120
  - MAX_ROOM_CAPACITY  = 999
  - ID_NUMBER_LENGTH   = 9     (Israeli national ID)
  - MAX_TAG_LENGTH     = 30
  - MAX_TAGS_PER_FIELD = 20
  - MAX_PHONE_LENGTH   = 10
  - DATE_PAST_YEARS    = 119   (how far back a birthdate can be)
  - DATE_FUTURE_YEARS  = 10
  - GRADE_FIRST_AGE    = 6     (below this = kindergarten)
  - GRADE_ADULT_AGE    = 18    (at or above = adult)
  - DEFAULT_AGE_MIN    = 5
  - DEFAULT_AGE_MAX    = 18
  - CLASS_NEAR_FULL_THRESHOLD = 0.8
*/
