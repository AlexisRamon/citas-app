"use server";

import { getNowMs, zonedDateTimeToUtc } from "@/lib/clinic-time";
import {
  isValidClockTime,
  validateWindows,
  type AvailabilityRule,
} from "@/lib/availability";
import { isValidIsoDate, parseIsoDate, toIsoDate } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_WINDOWS_PER_DAY = 3;
const MAX_BLOCK_DAYS = 366;
const MAX_REASON_LENGTH = 120;
const DAY_MS = 24 * 60 * 60 * 1000;

async function getContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("doctor_profiles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .maybeSingle<{ tenant_id: string }>();

  if (!profile) return null;

  return { supabase, tenantId: profile.tenant_id };
}

const NO_ACCESS: ActionResult = {
  ok: false,
  error: "Tu sesión expiró o no tienes acceso. Inicia sesión de nuevo.",
};

function addDaysIso(isoDate: string, amount: number) {
  const next = parseIsoDate(isoDate);
  next.setDate(next.getDate() + amount);
  return toIsoDate(next);
}

export async function saveSchedule(
  rules: AvailabilityRule[],
): Promise<ActionResult> {
  if (!Array.isArray(rules)) return { ok: false, error: "Horario inválido." };

  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const windows = rules.filter((rule) => rule.weekday === weekday);

    if (windows.length > MAX_WINDOWS_PER_DAY) {
      return { ok: false, error: "Máximo 3 horarios por día." };
    }

    const issue = validateWindows(windows);
    if (issue) return { ok: false, error: issue };
  }

  if (
    rules.some(
      (rule) =>
        !Number.isInteger(rule.weekday) || rule.weekday < 0 || rule.weekday > 6,
    )
  ) {
    return { ok: false, error: "Horario inválido." };
  }

  const context = await getContext();
  if (!context) return NO_ACCESS;

  const { error } = await context.supabase.rpc("save_availability_rules", {
    p_tenant: context.tenantId,
    p_rules: rules.map((rule) => ({
      weekday: rule.weekday,
      start: rule.start,
      end: rule.end,
    })),
  });

  if (error) {
    return { ok: false, error: "No pudimos guardar el horario. Inténtalo de nuevo." };
  }

  return { ok: true };
}

export type BlockInput = {
  allDay: boolean;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export async function createBlock(input: BlockInput): Promise<ActionResult> {
  if (!isValidIsoDate(input.startDate)) {
    return { ok: false, error: "Elige una fecha válida." };
  }

  const reason = (input.reason ?? "").trim().slice(0, MAX_REASON_LENGTH);

  let startsAt: Date;
  let endsAt: Date;

  if (input.allDay) {
    if (!isValidIsoDate(input.endDate) || input.endDate < input.startDate) {
      return { ok: false, error: "La fecha final no puede ser anterior a la inicial." };
    }

    const days =
      (parseIsoDate(input.endDate).getTime() -
        parseIsoDate(input.startDate).getTime()) /
        DAY_MS +
      1;
    if (days > MAX_BLOCK_DAYS) {
      return { ok: false, error: "Puedes bloquear hasta 1 año de una vez." };
    }

    startsAt = zonedDateTimeToUtc(input.startDate, "00:00:00");
    endsAt = zonedDateTimeToUtc(addDaysIso(input.endDate, 1), "00:00:00");
  } else {
    if (!isValidClockTime(input.startTime) || !isValidClockTime(input.endTime)) {
      return { ok: false, error: "Ingresa horas válidas." };
    }
    if (input.endTime <= input.startTime) {
      return { ok: false, error: "La hora final debe ser posterior a la inicial." };
    }

    startsAt = zonedDateTimeToUtc(input.startDate, input.startTime);
    endsAt = zonedDateTimeToUtc(input.startDate, input.endTime);
  }

  if (endsAt.getTime() <= getNowMs()) {
    return { ok: false, error: "No puedes bloquear un periodo que ya pasó." };
  }

  const context = await getContext();
  if (!context) return NO_ACCESS;

  const { count, error: countError } = await context.supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", context.tenantId)
    .eq("status", "confirmed")
    .lt("starts_at", endsAt.toISOString())
    .gt("ends_at", startsAt.toISOString());

  if (countError) {
    return { ok: false, error: "No pudimos revisar tus citas. Inténtalo de nuevo." };
  }

  if (count && count > 0) {
    return {
      ok: false,
      error: `Hay ${count} ${count === 1 ? "cita confirmada" : "citas confirmadas"} en ese periodo. Cancélalas primero en Citas.`,
    };
  }

  const { error } = await context.supabase.from("availability_blocks").insert({
    tenant_id: context.tenantId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    reason: reason || null,
  });

  if (error) {
    return { ok: false, error: "No pudimos crear el bloqueo. Inténtalo de nuevo." };
  }

  return { ok: true };
}

export async function deleteBlock(id: string): Promise<ActionResult> {
  if (!UUID_REGEX.test(id)) return { ok: false, error: "Bloqueo inválido." };

  const context = await getContext();
  if (!context) return NO_ACCESS;

  const { error, count } = await context.supabase
    .from("availability_blocks")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("tenant_id", context.tenantId);

  if (error || !count) {
    return { ok: false, error: "No pudimos quitar el bloqueo. Inténtalo de nuevo." };
  }

  return { ok: true };
}
