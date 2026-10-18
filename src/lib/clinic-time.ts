// Zona horaria del consultorio. Todas las horas de slots ("09:00") se
// interpretan en esta zona, sin importar el dispositivo del paciente.
// TODO: moverla a una columna `timezone` en `tenants`.
export const CLINIC_TIME_ZONE = "America/Mazatlan";

export function getNowMs(): number {
  return Date.now();
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  return asUtc - date.getTime();
}

/** "2026-10-16" + "09:30" (hora del consultorio) → instante UTC. */
export function zonedDateTimeToUtc(
  isoDate: string,
  time: string,
  timeZone: string = CLINIC_TIME_ZONE,
): Date {
  const normalized = time.length === 5 ? `${time}:00` : time;
  const guess = new Date(`${isoDate}T${normalized}Z`);
  return new Date(guess.getTime() - getTimeZoneOffsetMs(guess, timeZone));
}

/** Instante → fecha "YYYY-MM-DD" en la zona del consultorio. */
export function getClinicDateIso(
  date: Date | string,
  timeZone: string = CLINIC_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

/** Instante → hora "HH:MM" (24 h) en la zona del consultorio. */
export function getClinicTime(
  date: Date | string,
  timeZone: string = CLINIC_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(date));
}

export function getClinicTodayIso(): string {
  return getClinicDateIso(new Date());
}
