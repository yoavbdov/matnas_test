/*
  STUDENTS TOOLBAR — filter/search bar above the students table.

  Props:
  - onSearch(text)       : called when search text changes
  - onFilterStatus(val)  : "all" | "active" | "inactive"
  - onFilterClass(id)    : filter by which class the student is enrolled in
  - onSort(field, dir)   : sort by name A→Z or Z→A
  - onAddStudent()       : opens the add student modal
  - onExport()           : triggers Excel export of current visible students
  - onImport()           : opens Excel upload panel

  All inputs have appropriate maxLength constraints.
  No logic — just UI controls that call the prop callbacks.
*/
