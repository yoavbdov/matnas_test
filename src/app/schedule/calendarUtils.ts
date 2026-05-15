// Calendar layout constants and helpers

export const HOUR_HEIGHT = 64; // px per hour in the grid
export const START_HOUR = 8;   // scroll-to hour on initial load

/** Convert "HH:MM" string to total minutes from midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Convert minutes-from-midnight to pixel offset in the grid */
export function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT;
}
