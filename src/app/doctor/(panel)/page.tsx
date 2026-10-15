import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CalendarX2, LockKeyhole } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { AppointmentCard } from "@/components/ui/AppointmentCard";
import type { AppointmentStatus } from "@/components/ui/AppointmentCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatLongDate } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";

const CLINIC_TIME_ZONE = "America/Mazatlan";
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

function zonedDateTimeToUtc(isoDate: string, time: string, timeZone: string) {
  const guess = new Date(`${isoDate}T${time}Z`);
  return new Date(guess.getTime() - getTimeZoneOffsetMs(guess, timeZone));
}

export default async function DoctorDashboardPage() {
  await connection();

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

  const todayIso = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const dayStart = zonedDateTimeToUtc(todayIso, "00:00:00", CLINIC_TIME_ZONE);
  const dayEnd = zonedDateTimeToUtc(todayIso, "23:59:59", CLINIC_TIME_ZONE);

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