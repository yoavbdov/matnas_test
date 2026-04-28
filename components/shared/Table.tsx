/*
  TABLE — reusable sortable data table.

  Props:
  - columns    : array of { key, label, render? }
                 render? is an optional function to format a cell (e.g. show a badge)
  - rows       : array of data objects
  - onRowClick : called with the row's data when user clicks a row
  - sortable   : if true, clicking a column header sorts by that column

  Behavior:
  - Clicking a header sorts ascending; clicking again sorts descending
  - Row click opens whatever modal the parent page wants to show
  - If rows is empty: shows a "אין נתונים" message

  Keep this file under 80 lines. Cell rendering logic stays in the parent page.
*/
