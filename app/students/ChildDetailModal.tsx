/*
  CHILD DETAIL MODAL — full view of one student's information.

  Props:
  - child     : the Child to show
  - onClose   : close the modal
  - onEdit    : opens ChildFormModal for this child
  - onDelete  : shows ConfirmDialog, then deletes student + their enrollments

  Layout — two tabs:

  Tab 1: פרטים
    - Full name, gender, grade, age, date of birth
    - Israeli ID
    - Contact name + phone
    - Chess: israeli rating, FIDE rating, title, player IDs
    - Last rating sync date
    - Siblings: listed by name; clicking one opens their detail modal
    - Notes

  Tab 2: חוגים
    - List of classes this student is enrolled in
    - Each row: class name + "הסר רישום" button
    - "רשום לחוג" button → opens EnrollModal
*/
