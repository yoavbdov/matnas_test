/*
  REPORTS PAGE — dynamic filter-and-export tool.

  Step 1: Choose entity
    Dropdown: תלמידים | חוגים | מדריכים | חדרים

  Step 2: Build filters
    "הוסף פילטר" → opens a small inline form:
    - Pick a field (depends on chosen entity)
    - Pick an operator (contains / equals / starts with / greater than / etc.)
    - Enter a value (if needed)
    Each active filter shown as a chip with edit + remove buttons.
    Multiple filters are ANDed together.
    Search value inputs: maxLength MAX_SEARCH_LENGTH.

  Step 3: View results
    Table updates live as filters change.
    Columns depend on entity type (see blueprint Section 16).

  Step 4: Export
    "ייצוא לאקסל" → downloads filtered results as .xlsx
*/
