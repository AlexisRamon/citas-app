import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAvailabilityRules } from "@/lib/availability-data";
import { getClinicTodayIso, getNowMs } from "@/lib/clinic-time";
import { createClient } from "@/lib/supabase/server";
import { BlocksManager } from "./BlocksManager";
import type { BlockRow } from "./BlocksManager";
import { ScheduleEditor } from "./ScheduleEditor";

const MAX_BLOCKS = 100;

export default async function DisponibilidadPage() {
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

  const rules = await getAvailabilityRules(profile.tenant_id);

  const { data: blocksData, error: blocksError } = await supabase
    .from("availability_blocks")
    .select("id, starts_at, ends_at, reason")
    .eq("tenant_id", profile.tenant_id)
    .gte("ends_at", new Date(getNowMs()).toISOString())
    .order("starts_at", { ascending: true })
    .limit(MAX_BLOCKS);

  return (
    <div className="flex flex-col gap-ds-8">
      <PageHeader
        title="Disponibilidad"
        subtitle="Define tus horarios de atención y bloquea fechas u horas."
      />

      <section aria-labelledby="horario-semanal" className="flex flex-col gap-ds-4">
        <div className="flex flex-col gap-ds-1">
          <h2 id="horario-semanal" className="text-20 font-bold text-text">
            Horario semanal
          </h2>
          <p className="text-14 text-text-muted">
            Los pacientes reservan citas de 30 minutos dentro de estas horas.
          </p>
        </div>
        <ScheduleEditor initialRules={rules} />
      </section>

      <section aria-labelledby="bloqueos" className="flex flex-col gap-ds-4">
        <div className="flex flex-col gap-ds-1">
          <h2 id="bloqueos" className="text-20 font-bold text-text">
            Bloqueos
          </h2>
          <p className="text-14 text-text-muted">
            Vacaciones, congresos o ratos en los que no atiendes.
          </p>
        </div>

        {blocksError ? (
          <Alert
            variant="danger"
            title="No pudimos cargar tus bloqueos"
            description="Recarga la página e inténtalo de nuevo."
          />
        ) : (
          <BlocksManager
            blocks={(blocksData ?? []) as BlockRow[]}
            todayIso={getClinicTodayIso()}
          />
        )}
      </section>
    </div>
  );
}
