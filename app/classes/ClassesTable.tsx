/*
  // הטבלה שמציגה את רשימת החוגים — כל שורה היא חוג אחד עם שם החוג, המדריך, כמה ילדים רשומים ועוד פרטים.
  CLASSES TABLE — shows the filtered list of classes.

  Props:
  - classes     : filtered Class[]
  - teachers    : to look up teacher name by ID
  - enrollments : to count enrolled students per class
  - onRowClick  : opens ViewExistingClassDetailModal for that class

  Columns:
    שם | מדריך | טווח גילאים | טווח דירוגים | רשומים / קיבולת | סטטוס | ימי פעילות

  Enrollment shown as "12 / 20" with a color hint:
    teal = normal, orange = almost full, red = full
*/
