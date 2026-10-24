import { SLOT_MINUTES } from "@/lib/booking";
import { zonedDateTimeToUtc } from "@/lib/clinic-time";

/** Un slot ya empezó (o empieza ahora) en hora del consultorio. */
export function isSlotPast(isoDate: string, time: string, nowMs: number) {
  return nowMs > 0 && zonedDateTimeToUtc(isoDate, time).getTime() <= nowMs;
}

/** Intervalo ocupado (cita, bloqueo de horas o de varios días), en ms UTC. */
export type BusyRange = { startMs: number; endMs: number };

export function toBusyRanges(
  rows: { starts_at: string; ends_at: string }[],
): BusyRange[] {
  return rows.map((row) => ({
    startMs: new Date(row.starts_at).getTime(),
    endMs: new Date(row.ends_at).getTime(),
  }));
}

/** El slot de 30 min se traslapa con algún intervalo ocupado. */
export function isSlotBusy(isoDate: string, time: string, ranges: BusyRange[]) {
  const slotStart = zonedDateTimeToUtc(isoDate, time).getTime();
  const slotEnd = slotStart + SLOT_MINUTES * 60 * 1000;

  return ranges.some((range) => range.startMs < slotEnd && range.endMs > slotStart);
}
