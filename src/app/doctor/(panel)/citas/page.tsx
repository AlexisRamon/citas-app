import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CalendarX2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { AppointmentCard } from "@/components/ui/AppointmentCard";
import type { AppointmentStatus } from "@/components/ui/AppointmentCard";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CLINIC_TIME_ZONE,
  getClinicDateIso,
  getClinicTodayIso,
  getNowMs,
} from "@/lib/clinic-time";
import { formatLongDate } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";
import { CitaActions } from "./CitaActions";

type View = "proximas" | "historial";

type AppointmentRow = {
  id: string;
  starts_at: string;
  patient_name: string | null;
  patient_email: string | null;
  reason: string | null;
  status: AppointmentStatus;
};

type PageProps = {
  searchParams: Promise<{ vista?: string }>;
};

const HISTORY_DAYS = 90;
const MAX_ROWS = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

const TABS: { view: View; label: string; href: string }[] = [
  { view: "proximas", label: "Próximas", href: "/doctor/citas" },
  { view: "historial", label: "Historial", href: "/doctor/citas?vista=historial" },
];

export default async function CitasPage({ searchParams }: PageProps) {
  await connection();

  const { vista } = await searchParams;
  const view: View = vista === "historial" ? "historial" : "proximas";

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

  const nowMs = getNowMs();
  const nowIso = new Date(nowMs).toISOString();
  const historyStartIso = new Date(nowMs - HISTORY_DAYS * DAY_MS).toISOString();

  const base = supabase
    .from("appointments")
    .select("id, starts_at, patient_name, patient_email, reason, status")
    .eq("tenant_id", profile.tenant_id);

  const { data, error } =
    view === "proximas"
      ? await base
          .in("status", ["confirmed", "cancelled"])
          .gte("starts_at", nowIso)
          .order("starts_at", { ascending: true })
          .limit(MAX_ROWS)
      : await base
          .in("status", ["confirmed", "attended", "cancelled"])
          .lt("starts_at", nowIso)
          .gte("starts_at", historyStartIso)
          .order("starts_at", { ascending: false })
          .limit(MAX_ROWS);

  const rows = (data ?? []) as AppointmentRow[];

  const groups: { iso: string; items: AppointmentRow[] }[] = [];
  for (const row of rows) {
    const iso = getClinicDateIso(row.starts_at);
    const last = groups[groups.length - 1];
    if (last && last.iso === iso) last.items.push(row);
    else groups.push({ iso, items: [row] });
  }

  const todayIso = getClinicTodayIso();

  return (
    <div className="flex flex-col gap-ds-6">
      <PageHeader
        title="Citas"
        subtitle="Gestiona las citas de tus pacientes."
      />

      <nav aria-label="Vista de citas" className="flex gap-ds-2">
        {TABS.map((tab) => {
          const active = tab.view === view;

          return (
            <Link
              key={tab.view}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[44px] items-center rounded-sm px-ds-4 text-16 ${
                active
                  ? "bg-surface-soft font-bold text-primary"
                  : "text-text-muted hover:bg-surface-soft"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {error ? (
        <Alert
          variant="danger"
          title="No pudimos cargar las citas"
          description="Recarga la página e inténtalo de nuevo."
        />
      ) : rows.length === 0 ? (
        <section
          aria-labelledby="sin-citas"
          className="flex flex-col items-center justify-center gap-ds-3 py-ds-8 text-center"
        >
          <CalendarX2 size={64} aria-hidden="true" className="text-text-muted" />
          <h2 id="sin-citas" className="text-20 font-bold text-text">
            {view === "proximas" ? "No hay citas próximas" : "Sin historial"}
          </h2>
          <p className="text-14 text-text-muted">
            {view === "proximas"
              ? "Cuando alguien agende, aparecerá aquí."
              : `No hay citas de los últimos ${HISTORY_DAYS} días.`}
          </p>
        </section>
      ) : (
        <div className="flex flex-col gap-ds-6">
          {groups.map((group) => (
            <section
              key={group.iso}
              aria-labelledby={`dia-${group.iso}`}
              className="flex flex-col gap-ds-2"
            >
              <h2
                id={`dia-${group.iso}`}
                className="text-14 font-bold uppercase text-text-muted"
              >
                {group.iso === todayIso
                  ? `Hoy · ${formatLongDate(group.iso)}`
                  : formatLongDate(group.iso)}
              </h2>

              <ul className="flex flex-col gap-ds-3">
                {group.items.map((cita) => (
                  <li key={cita.id} className="flex flex-col gap-ds-2">
                    <AppointmentCard
                      startsAt={cita.starts_at}
                      patientName={cita.patient_name ?? "Paciente sin nombre"}
                      patientEmail={cita.patient_email}
                      reason={cita.reason}
                      status={cita.status}
                      timeZone={CLINIC_TIME_ZONE}
                    />
                    <CitaActions
                      id={cita.id}
                      status={cita.status}
                      canMarkAttended={new Date(cita.starts_at).getTime() <= nowMs}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
