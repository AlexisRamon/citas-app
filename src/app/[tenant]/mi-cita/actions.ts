"use server";

import { MIN_CANCEL_HOURS } from "@/lib/booking";
import {
  buildClinicCancelledByPatientEmail,
  buildPatientSelfCancelEmail,
} from "@/lib/booking-email";
import { getClinicEmail } from "@/lib/clinic-notify";
import { getClinicDateIso, getClinicTime, getNowMs } from "@/lib/clinic-time";
import { sendEmail } from "@/lib/email";
import { formatLongDate, formatTimeLabel } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySlug } from "@/lib/tenant";

export type CancelMineResult =
  | { ok: true; emailSent: boolean }
  | { ok: false; error: string };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HOUR_MS = 60 * 60 * 1000;

type AppointmentRow = {
  id: string;
  starts_at: string;
  status: string;
  patient_name: string | null;
};

export async function cancelMyAppointment(
  slug: string,
  id: string,
): Promise<CancelMineResult> {
  if (typeof slug !== "string" || !UUID_REGEX.test(id)) {
    return { ok: false, error: "Cita inválida." };
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant) return { ok: false, error: "No encontramos el consultorio." };

  const tooLateMessage = `Ya no puedes cancelar en línea con menos de ${MIN_CANCEL_HOURS} horas de anticipación.${
    tenant.phone ? ` Contacta al consultorio: ${tenant.phone}.` : " Contacta al consultorio."
  }`;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { ok: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };
  }

  // La RLS solo devuelve citas del propio paciente.
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, starts_at, status, patient_name")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .eq("patient_id", user.id)
    .maybeSingle<AppointmentRow>();

  if (!appointment) return { ok: false, error: "No encontramos la cita." };

  if (appointment.status !== "confirmed") {
    return { ok: false, error: "Esta cita ya no se puede cancelar." };
  }

  if (new Date(appointment.starts_at).getTime() - getNowMs() < MIN_CANCEL_HOURS * HOUR_MS) {
    return { ok: false, error: tooLateMessage };
  }

  const { error: updateError, count } = await supabase
    .from("appointments")
    .update({ status: "cancelled" }, { count: "exact" })
    .eq("id", id)
    .eq("patient_id", user.id)
    .eq("status", "confirmed");

  if (updateError) {
    if ((updateError.message ?? "").includes("cancel_too_late")) {
      return { ok: false, error: tooLateMessage };
    }
    return { ok: false, error: "No pudimos cancelar la cita. Inténtalo de nuevo." };
  }

  if (!count) {
    return { ok: false, error: "No pudimos cancelar la cita. Inténtalo de nuevo." };
  }

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  const dateLabel = formatLongDate(getClinicDateIso(appointment.starts_at));
  const timeLabel = formatTimeLabel(getClinicTime(appointment.starts_at));
  const patientName = appointment.patient_name ?? "paciente";

  const toPatient = buildPatientSelfCancelEmail({
    patientName,
    doctorName: tenant.name,
    dateLabel,
    timeLabel,
    bookingUrl: domain ? `https://${domain}/${tenant.slug}/agendar` : null,
  });

  const emailSent = await sendEmail({ to: user.email, ...toPatient });

  // Aviso al consultorio (si configuró su correo de avisos).
  const clinicEmail = await getClinicEmail(supabase, appointment.id);
  if (clinicEmail) {
    await sendEmail({
      to: clinicEmail,
      ...buildClinicCancelledByPatientEmail({
        patientName,
        patientEmail: user.email,
        dateLabel,
        timeLabel,
        agendaUrl: domain ? `https://${domain}/doctor/citas` : null,
      }),
    });
  }

  return { ok: true, emailSent };
}
