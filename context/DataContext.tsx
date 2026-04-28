/*
  DATA CONTEXT — one place that holds ALL the app's live Firestore data.

  Internally calls useCollection for every collection:
    students, classes, teachers, rooms, physicalEquipment, enrollments, competitions, customEventTypes

  Exposes them all via context so any component can grab what it needs
  without each component making its own Firestore calls.

  Also holds app settings (loaded once from Firestore "settings" doc).

  Exports: useData() helper — call this anywhere to get the data.

  Example use in a component:
    const { students, classes } = useData()
*/
