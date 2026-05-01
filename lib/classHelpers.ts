/*
  CLASS / SCHEDULE LOGIC — pure functions, no Firebase, no UI.
  Used by the classes page and the schedule page.
*/

import { timeToMins } from "./utils";
import type { ScheduleSlot, Class, Resource } from "./types";

// Check if two slots occupy overlapping time on the same weekday
// (ignores room — used to detect teacher double-booking)
export function slotsOverlapTime(slotA: ScheduleSlot, slotB: ScheduleSlot): boolean {
  if (slotA.day !== slotB.day) return false;
  const aStart = timeToMins(slotA.start_time);
  const aEnd = timeToMins(slotA.end_time);
  const bStart = timeToMins(slotB.start_time);
  const bEnd = timeToMins(slotB.end_time);
  // Overlap exists when one starts before the other ends
  return aStart < bEnd && bStart < aEnd;
}

// Check if two slots truly conflict: same room AND overlapping time on the same day
export function slotsConflict(slotA: ScheduleSlot, slotB: ScheduleSlot): boolean {
  if (!slotA.room_id || slotA.room_id !== slotB.room_id) return false;
  return slotsOverlapTime(slotA, slotB);
}

// Count how many units of a resource are in use simultaneously across all classes.
// Caller compares returned number to resource.quantity to detect a shortage.
// Pass ignoreClassId to exclude a class being edited (so it doesn't conflict with itself).
export function calcResourceAvailability(
  resource: Resource,
  allClasses: Class[],
  ignoreClassId?: string
): number {
  // Gather all slots from classes that use this resource
  const slots: ScheduleSlot[] = [];
  for (const cls of allClasses) {
    if (cls.id === ignoreClassId) continue;
    if (!(cls.resource_ids ?? []).includes(resource.id)) continue;
    for (const slot of cls.slots ?? []) {
      slots.push(slot);
    }
  }

  // For each slot, count how many other slots overlap with it
  // The maximum count found is the peak simultaneous usage
  let peakUsage = 0;
  for (let i = 0; i < slots.length; i++) {
    let concurrent = 0;
    for (let j = 0; j < slots.length; j++) {
      if (slotsOverlapTime(slots[i], slots[j])) concurrent++;
    }
    if (concurrent > peakUsage) peakUsage = concurrent;
  }

  return peakUsage;
}

// Return the IDs of all classes whose slots share a room + time with the target class
export function getConflictingClassIds(
  targetClass: Class,
  allClasses: Class[]
): string[] {
  const conflictIds: string[] = [];

  for (const other of allClasses) {
    if (other.id === targetClass.id) continue; // skip self

    let hasConflict = false;
    outer: for (const slotA of targetClass.slots ?? []) {
      for (const slotB of other.slots ?? []) {
        if (slotsConflict(slotA, slotB)) {
          hasConflict = true;
          break outer;
        }
      }
    }

    if (hasConflict) conflictIds.push(other.id);
  }

  return conflictIds;
}
