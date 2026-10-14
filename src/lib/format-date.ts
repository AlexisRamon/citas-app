const WEEKDAYS_LONG = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidIsoDate(isoDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  return toIsoDate(parseIsoDate(isoDate)) === isoDate;
}

export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function formatLongDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return `${WEEKDAYS_LONG[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export function formatDateRange(startIso: string, endIso: string): string {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${end.getDate()} de ${MONTHS[end.getMonth()]}`;
  }

  return `${start.getDate()} de ${MONTHS[start.getMonth()]} – ${end.getDate()} de ${MONTHS[end.getMonth()]}`;
}

export function formatTimeLabel(time: string): string {
  if (!isValidTime(time)) return time;

  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "p. m." : "a. m.";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}