/*
  STUDENTS PAGE — composes the student management UI.
  This file is just the composition: it renders the toolbar, table, and modals.
  No logic here — logic lives in subcomponents and hooks.

  Modals managed here (open/close state lives here):
  - ChildFormModal   : add or edit a student
  - ChildDetailModal : view a student's full details + their classes
  - ExcelUploadPanel : bulk import students from Excel

  Passes data down from useData() to each subcomponent.
*/
