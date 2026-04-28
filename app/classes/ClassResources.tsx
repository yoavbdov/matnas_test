/*
  // החלק בטופס החוג שבו בוחרים איזה ציוד החוג צריך (למשל: לוחות שחמט, כדורים וכו׳) וכמה יחידות.
  CLASS RESOURCES — assign equipment/resources to a class.

  Props: assignments[], resources[], onChange(assignments[])

  For each assignment:
  - Resource dropdown (from all resources)
  - Quantity needed (1 – MAX_INT_INPUT)
  - Shows: available units = resource.quantity - already used by other classes
  - If requested quantity > available: show red warning "אין מספיק יחידות"
  - X button to remove the assignment

  "הוסף משאב" button adds a new row.
  No two rows can have the same resource.
*/
