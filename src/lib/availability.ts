import { SLOT_MINUTES } from "@/lib/booking";
import { parseIsoDate } from "@/lib/format-date";

/** Ventana de atención semanal. weekday: 0 = domingo … 6 = sábado. Horas "HH:MM". */
export type AvailabilityRule = {
  weekday: number;
  start: string;
  end: string;
};

export type TimeWindow = { start: string; end: string };

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const NOON = "12:00";

export function isValidClockTime(value: string) {
  return TIME_REGEX.test(value);
}

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(total: number) {
  const hours = String(Math.floor(total / 60)).padStart(2, "0");
  const minutes = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Slots de 30 min que caben en las ventanas de un día de la semana. */
export function getSlotsForWeekday(rules: AvailabilityRule[], weekday: number) {
  const slots = new Set<string>();

  for (const rule of rules) {
    if (rule.weekday !== weekday) continue;

    const end = toMinutes(rule.end);
    for (let at = toMinutes(rule.start); at + SLOT_MINUTES <= end; at += SLOT_MINUTES) {
      slots.add(fromMinutes(at));
    }
  }

  return [...slots].sort();
}

export function getSlotsForDate(rules: AvailabilityRule[], isoDate: string) {
  return getSlotsForWeekday(rules, parseIsoDate(isoDate).getDay());
}

export function hasHoursOnWeekday(rules: AvailabilityRule[], weekday: number) {
  return getSlotsForWeekday(rules, weekday).length > 0;
}

export function splitByPeriod(slots: string[]) {
  return {
    morning: slots.filter((time) => time < NOON),
    afternoon: slots.filter((time) => time >= NOON),
  };
}

/** Devuelve un mensaje de error o null si las ventanas son válidas. */
export function validateWindows(windows: TimeWindow[]): string | null {
  for (const window of windows) {
    if (!isValidClockTime(window.start) || !isValidClockTime(window.end)) {
      return "Ingresa horas válidas.";
    }

    const start = toMinutes(window.start);
    const end = toMinutes(window.end);

    if (end <= start) return "La hora final debe ser posterior a la inicial.";
    if (start % SLOT_MINUTES !== 0 || end % SLOT_MINUTES !== 0) {
      return "Usa horas en punto o y media (:00 o :30).";
    }
  }

  const sorted = [...windows].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (let i = 1; i < sorted.length; i += 1) {
    if (toMinutes(sorted[i].start) < toMinutes(sorted[i - 1].end)) {
      return "Los horarios no pueden traslaparse.";
    }
  }

  return null;
}
