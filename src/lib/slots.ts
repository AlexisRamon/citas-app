import { zonedDateTimeToUtc } from "@/lib/clinic-time";

export const MORNING_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
export const AFTERNOON_SLOTS = ["16:00", "16:30"];
export const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

/** Un slot ya empezó (o empieza ahora) en hora del consultorio. */
export function isSlotPast(isoDate: string, time: string, nowMs: number) {
  return nowMs > 0 && zonedDateTimeToUtc(isoDate, time).getTime() <= nowMs;
}
