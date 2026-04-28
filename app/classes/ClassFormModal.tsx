/*
  // החלון שנפתח כשרוצים להוסיף חוג חדש או לערוך חוג קיים — כולל את כל הפרטים, מועדי הפעילות והציוד הנדרש.
  CLASS FORM MODAL — add or edit a class. Split into 3 sub-sections.
  This file just composes them; each sub-section is its own component below.

  Props:
  - classItem : Class | null (null = add, object = edit)
  - onClose   : close modal
  - onSaved   : called after save

  Composed of:
  - ClassBasicFields   : name, teacher, capacity, age range, rating range, status
  - ClassScheduleSlots : add/edit/remove schedule slots (day, time, room, recurrence)
  - ClassResources     : assign resources with quantities

  Validation on submit:
  - Name required
  - Teacher required
  - At least one schedule slot required
  - No slot can have end time before start time
  Saves with addDocument or updateDocument.
*/
