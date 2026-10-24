"use server";

import { getClinicDateIso, getClinicTime } from "@/lib/clinic-time";
import { buildCancellationEmail, sendEmail } from "@/lib/email";
import { formatLongDate, formatTimeLabel } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";

export type CancelResult =
  | { ok: true; emailSent: boolean }
  | { ok: false; error: string };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MESSAGE_LENGTH = 300;

type ProfileRow = {
  tenant_id: string;
  tenants: {
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
  } | null;
};

type AppointmentRow = {
  id: string;
  starts_at: string;
  patient_name: string | null;
  patient_email: string | null;
  status: string;
};

export async function cancelAppointment(
  id: string,
  message?: string,
): Promise<CancelResult> {
  if (!UUID_REGEX.test(id)) {
    return { ok: false, error: "Cita inválida." };
  }

  const note = (message ?? "").trim().slice(0, MAX_MESSAGE_LENGTH);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };
  }

  const { data: profile } = await supabase
    .from("doctor_profiles")
    .select("tenant_id, tenants(name, slug, address, phone)")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  if (!profile || !profile.tenants) {
    return { ok: false, error: "Tu cuenta no tiene acceso a este consultorio." };
  }

  // Todo se lee de la base: el navegador solo manda el id de la cita.
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, starts_at, patient_name, patient_email, status")
    .eq("id", id)
    .eq("tenant_id", profile.tenant_id)
    .maybeSingle<AppointmentRow>();

  if (!appointment) {
    return { ok: false, error: "No encontramos la cita." };
  }

  if (appointment.status !== "confirmed") {
    return { ok: false, error: "Solo se pueden cancelar citas confirmadas." };
  }

  const { error: updateError, count } = await supabase
    .from("appointments")
    .update({ status: "cancelled" }, { count: "exact" })
    .eq("id", id)
    .eq("tenant_id", profile.tenant_id)
    .eq("status", "confirmed");

  if (updateError || !count) {
    return { ok: false, error: "No pudimos cancelar la cita. Inténtalo de nuevo." };
  }

  if (!appointment.patient_email) {
    return { ok: true, emailSent: false };
  }

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  const tenant = profile.tenants;

  const email = buildCancellationEmail({
    patientName: appointment.patient_name ?? "paciente",
    doctorName: tenant.name,
    dateLabel: formatLongDate(getClinicDateIso(appointment.starts_at)),
    timeLabel: formatTimeLabel(getClinicTime(appointment.starts_at)),
    address: tenant.address ?? "",
    phone: tenant.phone ?? "",
    message: note,
    bookingUrl: domain ? `https://${domain}/${tenant.slug}/agendar` : null,
  });

  const emailSent = await sendEmail({
    to: appointment.patient_email,
    ...email,
  });

  return { ok: true, emailSent };
}
