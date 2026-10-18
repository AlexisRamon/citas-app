import { getNowMs, zonedDateTimeToUtc } from "@/lib/clinic-time";

export const SLOT_MINUTES = 30;
export const HOLD_MINUTES = 10;

/** Inicio del slot como instante UTC (la hora se lee en zona del consultorio). */
export function getSlotStart(isoDate: string, time: string): Date {
  return zonedDateTimeToUtc(isoDate, time);
}

/** Campos de tiempo para insertar un hold temporal en `appointments`. */
export function buildHold(isoDate: string, time: string) {
  const startsAt = getSlotStart(isoDate, time);
  const endsAt = new Date(startsAt.getTime() + SLOT_MINUTES * 60 * 1000);
  const holdExpiresAt = new Date(getNowMs() + HOLD_MINUTES * 60 * 1000);

  return {
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    hold_expires_at: holdExpiresAt.toISOString(),
  };
}
