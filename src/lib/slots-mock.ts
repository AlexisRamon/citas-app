export const ALL_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "16:00", "16:30",
] as const;

export const MORNING_SLOTS = ALL_SLOTS.slice(0, 6);
export const AFTERNOON_SLOTS = ALL_SLOTS.slice(6);

export function isKnownSlot(time: string): boolean {
  return (ALL_SLOTS as readonly string[]).includes(time);
}

export function getBusySlots(isoDate: string): Set<string> {
  const day = parseInt(isoDate.split("-")[2], 10);
  return new Set<string>(
    ALL_SLOTS.filter((_, i) => (i + day) % 3 === 0),
  );
}

export function getAvailableCount(isoDate: string): number {
  return ALL_SLOTS.length - getBusySlots(isoDate).size;
}