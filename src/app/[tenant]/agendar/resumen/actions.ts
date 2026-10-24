"use server";

import { SLOT_MINUTES, getSlotStart } from "@/lib/booking";
import {
  buildClinicNewBookingEmail,
  buildConfirmationEmail,
} from "@/lib/booking-email";
import { getClinicEmail } from "@/lib/clinic-notify";
import { getClinicDateIso, getClinicTime, getNowMs } from "@/lib/clinic-time";
import { sendEmail } from "@/lib/email";
import {
  formatLongDate,
  formatTimeLabel,
  isValidIsoDate,
  isValidTime,
} from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySlug } from "@/lib/tenant";

export type BookingResult =
  | { ok: true; emailSent: boolean }
  | { ok: false; error: string; slotUnavailable?: boolean };

type BookingInput = {
  slug: string;
  date: string;
  time: string;
  name: string;
};

// Tope de citas futuras confirmadas por paciente en un consultorio.
const MAX_UPCOMING_APPOINTMENTS = 5;
const MAX_NAME_LENGTH = 120;
const SLOT_TAKEN_CODES = ["23P01", "23505"];

export async function bookAppointment(input: BookingInput): Promise<BookingResult> {
  const name = (input.name ?? "").trim().slice(0, MAX_NAME_LENGTH);

  if (
    typeof input.slug !== "string" ||
    !isValidIsoDate(input.date) ||
    !isValidTime(input.time) ||
    name.length < 2
  ) {
    return { ok: false, error: "Revisa los datos de tu cita e inténtalo de nuevo." };
  }

  const tenant = await getTenantBySlug(input.slug);
  if (!tenant) return { ok: false, error: "No encontramos el consultorio." };

  if (tenant.currentStatus === "agenda-cerrada") {
    return {
      ok: false,
      error: "El consultorio cerró su agenda por ahora. Intenta más tarde.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { ok: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };
  }

  const { count: upcoming, error: countError } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("patient_id", user.id)
    .eq("status", "confirmed")
    .gte("starts_at", new Date(getNowMs()).toISOString());

  if (countError) {
    return { ok: false, error: "No pudimos confirmar tu cita. Inténtalo de nuevo." };
  }

  if ((upcoming ?? 0) >= MAX_UPCOMING_APPOINTMENTS) {
    return {
      ok: false,
      error: `Ya tienes ${MAX_UPCOMING_APPOINTMENTS} citas próximas con este consultorio. Cancela o espera a que pase alguna.`,
    };
  }

  const startsAt = getSlotStart(input.date, input.time);
  const endsAt = new Date(startsAt.getTime() + SLOT_MINUTES * 60 * 1000);

  const appointmentId = crypto.randomUUID();

  const { error: insertError } = await supabase.from("appointments").insert({
    id: appointmentId,
    tenant_id: tenant.id,
    patient_id: user.id,
    patient_name: name,
    patient_email: user.email,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: "confirmed",
  });

  if (insertError) {
    const message = insertError.message ?? "";

    if (message.includes("agenda_closed")) {
      return {
        ok: false,
        error: "El consultorio cerró su agenda por ahora. Intenta más tarde.",
      };
    }
    if (message.includes("outside_hours")) {
      return {
        ok: false,
        error: "Ese horario está fuera del horario de atención. Elige otro.",
        slotUnavailable: true,
      };
    }
    if (message.includes("invalid_start")) {
      return { ok: false, error: "Ese horario ya pasó. Elige otro.", slotUnavailable: true };
    }
    if (SLOT_TAKEN_CODES.includes(insertError.code ?? "")) {
      return {
        ok: false,
        error: "Ese horario ya no está disponible. Elige otro.",
        slotUnavailable: true,
      };
    }

    return { ok: false, error: "No pudimos confirmar tu cita. Inténtalo de nuevo." };
  }

  // La cita ya está confirmada: si el correo falla, no se revierte.
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;

  const email = buildConfirmationEmail({
    patientName: name,
    doctorName: tenant.name,
    dateLabel: formatLongDate(getClinicDateIso(startsAt)),
    timeLabel: formatTimeLabel(getClinicTime(startsAt)),
    address: tenant.address || (tenant.addressLines ?? []).join(", "),
    phone: tenant.phone,
    myAppointmentsUrl: domain ? `https://${domain}/${tenant.slug}/mi-cita` : null,
  });

  const emailSent = await sendEmail({ to: user.email, ...email });

  // Aviso al consultorio (si configuró su correo de avisos).
  const clinicEmail = await getClinicEmail(supabase, appointmentId);
  if (clinicEmail) {
    await sendEmail({
      to: clinicEmail,
      ...buildClinicNewBookingEmail({
        patientName: name,
        patientEmail: user.email,
        dateLabel: formatLongDate(getClinicDateIso(startsAt)),
        timeLabel: formatTimeLabel(getClinicTime(startsAt)),
        agendaUrl: domain ? `https://${domain}/doctor/citas` : null,
      }),
    });
  }

  return { ok: true, emailSent };
}
