import { redirect } from "next/navigation";
import { CalendarX2, LockKeyhole } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { AppointmentCard } from "@/components/ui/AppointmentCard";
import type { AppointmentStatus } from "@/components/ui/AppointmentCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CLINIC_TIME_ZONE,
  getClinicTodayIso,
  zonedDateTimeToUtc,
} from "@/lib/clinic-time";
import { formatLongDate } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";

const VISIBLE_STATUSES: AppointmentStatus[] = ["confirmed", "attended"];

type AppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  patient_name: string | null;
  patient_email: string | null;
  reason: string | null;
  status: AppointmentStatus;
};

export default async function DoctorDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/doctor/login");

  const { data: profile } = await supabase
    .from("doctor_profiles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .maybeSingle<{ tenant_id: string }>();

  if (!profile) redirect("/doctor/login?error=sin-acceso");

  const todayIso = getClinicTodayIso();
  const dayStart = zonedDateTimeToUtc(todayIso, "00:00:00");
  const dayEnd = zonedDateTimeToUtc(todayIso, "23:59:59");

  const { data, error } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, patient_name, patient_email, reason, status")
    .eq("tenant_id", profile.tenant_id)
    .in("status", VISIBLE_STATUSES)
    .gte("starts_at", dayStart.toISOString())
    .lte("starts_at", dayEnd.toISOString())
    .order("starts_at", { ascending: true });

  const citas = (data ?? []) as AppointmentRow[];
  const total = citas.length;

  const title =
    total > 0
      ? `Hoy · ${formatLongDate(todayIso)} · ${total} ${total === 1 ? "cita" : "citas"}`
      : `Hoy · ${formatLongDate(todayIso)}`;

  return (
    <>
      <div className="flex flex-col gap-ds-6 pb-[calc(56px+var(--spacing-ds-7)+var(--spacing-ds-6))]">
        <PageHeader
          title={title}
          subtitle="Tu agenda del día, en un solo lugar."
          actions={<Badge variant="verificado" />}
        />

        {error ? (
          <Alert
            variant="danger"
            title="No pudimos cargar las citas de hoy"
            description="Recarga la página e inténtalo de nuevo."
          />
        ) : total === 0 ? (
          <section
            aria-labelledby="sin-citas"
            className="flex flex-col items-center justify-center gap-ds-3 py-ds-8 text-center"
          >
            <CalendarX2
              size={64}
              aria-hidden="true"
              className="text-text-muted"
            />
            <h2 id="sin-citas" className="text-20 font-bold text-text">
              No hay citas hoy
            </h2>
            <p className="text-14 text-text-muted">
              Cuando alguien agende, aparecerá aquí.
            </p>
          </section>
        ) : (
          <section
            aria-labelledby="pacientes-hoy"
            className="flex flex-col gap-ds-2"
          >
            <div className="flex items-center justify-between gap-ds-3 pb-ds-2 text-14 text-text-muted">
              <h2 id="pacientes-hoy" className="font-bold uppercase">
                Pacientes de hoy
              </h2>
              <p>
                {total} {total === 1 ? "cita programada" : "citas programadas"}
              </p>
            </div>

            <ul className="flex flex-col gap-ds-2">
              {citas.map((cita) => (
                <li key={cita.id}>
                  <AppointmentCard
                    startsAt={cita.starts_at}
                    patientName={cita.patient_name ?? "Paciente sin nombre"}
                    patientEmail={cita.patient_email}
                    reason={cita.reason}
                    status={cita.status}
                    timeZone={CLINIC_TIME_ZONE}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <Button
        variant="primary"
        icon={<LockKeyhole size={20} aria-hidden="true" />}
        className="fixed bottom-ds-7 right-ds-7 z-30 w-[208px]"
      >
        Cerrar agenda
      </Button>
    </>
  );
}
