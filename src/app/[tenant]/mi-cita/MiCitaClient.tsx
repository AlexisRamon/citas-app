"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, CalendarX2 } from "lucide-react";
import { PatientAuthCard } from "@/components/auth/PatientAuthCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import {
  getClinicDateIso,
  getClinicTime,
  getNowMs,
} from "@/lib/clinic-time";
import { formatLongDate, formatTimeLabel } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/lib/tenant";

type MyAppointment = {
  id: string;
  starts_at: string;
  status: "confirmed" | "cancelled";
};

type LoadState =
  | { kind: "loading" }
  | { kind: "anon" }
  | { kind: "error" }
  | { kind: "ready"; email: string | null; items: MyAppointment[] };

type MiCitaClientProps = {
  tenant: Tenant;
};

export function MiCitaClient({ tenant }: MiCitaClientProps) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [signOutError, setSignOutError] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAppointments() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        // Sin sesión: pedir inicio de sesión con el correo de la reserva.
        if (!user) {
          setState({ kind: "anon" });
          return;
        }

        // La RLS (patient_id = auth.uid()) garantiza que solo se vean las
        // citas de la cuenta que verificó ese correo.
        const { data, error } = await supabase
          .from("appointments")
          .select("id, starts_at, status")
          .eq("tenant_id", tenant.id)
          .eq("patient_id", user.id)
          .in("status", ["confirmed", "cancelled"])
          .gte("starts_at", new Date(getNowMs()).toISOString())
          .order("starts_at", { ascending: true });

        if (cancelled) return;

        if (error || !data) {
          setState({ kind: "error" });
          return;
        }

        setState({
          kind: "ready",
          email: user.email ?? null,
          items: data as MyAppointment[],
        });
      } catch {
        if (!cancelled) setState({ kind: "error" });
      }
    }

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, [tenant.id, reloadKey]);

  function handleLoggedIn() {
    setState({ kind: "loading" });
    setReloadKey((current) => current + 1);
  }

  async function handleSignOut() {
    setSignOutError(undefined);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setSignOutError("No pudimos cerrar la sesión. Inténtalo de nuevo.");
      return;
    }

    setState({ kind: "anon" });
  }

  const address = tenant.address || (tenant.addressLines ?? []).join(", ");
  const items = state.kind === "ready" ? state.items : [];

  return (
    <>
      <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pb-[calc(64px+var(--spacing-ds-6)+env(safe-area-inset-bottom))] pt-ds-3">
        <header className="flex items-center gap-ds-3">
          <div
            aria-hidden="true"
            className="flex size-[40px] items-center justify-center rounded-md bg-surface-soft"
          >
            <span className="text-16 font-bold text-primary">
              {tenant.initials}
            </span>
          </div>
          <p className="text-14 font-bold text-text">{tenant.name}</p>
        </header>

        <div className="flex flex-col gap-ds-1">
          <h1 className="text-24 font-bold text-text">Mi cita</h1>
          {state.kind === "ready" && state.email ? (
            <div className="flex flex-wrap items-center gap-x-ds-3 text-14 text-text-muted">
              <p>Sesión: {state.email}</p>
              <button
                type="button"
                onClick={handleSignOut}
                className="min-h-[44px] font-bold text-primary underline"
              >
                Cerrar sesión
              </button>
            </div>
          ) : null}
          {signOutError ? (
            <p role="alert" className="text-14 text-danger">
              {signOutError}
            </p>
          ) : null}
        </div>

        {state.kind === "loading" ? (
          <div
            role="status"
            aria-label="Cargando tus citas"
            className="flex flex-col gap-ds-3"
          >
            <div className="h-[104px] w-full rounded-md bg-surface-soft" />
            <div className="h-[104px] w-full rounded-md bg-surface-soft" />
          </div>
        ) : state.kind === "anon" ? (
          <PatientAuthCard
            onAuthenticated={handleLoggedIn}
            title="Inicia sesión para ver tus citas agendadas"
            description="Entra con el correo con el que agendaste."
          />
        ) : state.kind === "error" ? (
          <Alert
            variant="danger"
            title="No pudimos cargar tus citas"
            description="Revisa tu conexión y recarga la página."
          />
        ) : items.length === 0 ? (
          <section
            aria-labelledby="mi-cita-vacio"
            className="flex flex-1 flex-col items-center justify-center gap-ds-3 text-center"
          >
            <div
              aria-hidden="true"
              className="flex size-[88px] items-center justify-center rounded-full bg-disabled text-text-muted"
            >
              <CalendarX2 size={48} />
            </div>
            <h2 id="mi-cita-vacio" className="text-20 font-bold text-text">
              No tienes citas próximas
            </h2>
            <p className="text-14 text-text-muted">
              Cuando agendes una, aparecerá aquí.
            </p>
          </section>
        ) : (
          <ul className="flex flex-col gap-ds-3">
            {items.map((item) => {
              const [clock, ...periodParts] = formatTimeLabel(
                getClinicTime(item.starts_at),
              ).split(" ");
              const period = periodParts.join(" ");

              return (
                <li key={item.id}>
                  <article className="flex items-center gap-ds-4 rounded-md border border-border bg-surface p-ds-5">
                    <time
                      dateTime={item.starts_at}
                      className="flex h-[64px] w-[58px] shrink-0 flex-col items-center justify-center rounded-sm bg-surface-soft font-bold text-primary"
                    >
                      <span className="text-16">{clock}</span>
                      {period ? <span className="text-14">{period}</span> : null}
                    </time>

                    <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
                      <p className="text-16 font-bold text-text">
                        {formatLongDate(getClinicDateIso(item.starts_at))}
                      </p>
                      <p className="text-14 text-text-muted">{tenant.name}</p>
                      {address ? (
                        <p className="text-14 text-text-muted">{address}</p>
                      ) : null}
                    </div>

                    {item.status === "cancelled" ? (
                      <Badge variant="cancelada" />
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        <Button
          href={`/${tenant.slug}/agendar`}
          variant="primary"
          icon={<CalendarPlus size={20} aria-hidden="true" />}
          className="mt-auto w-full"
        >
          {items.length > 0 ? "Agendar otra cita" : "Agendar cita"}
        </Button>
      </main>

      <BottomNav slug={tenant.slug} activeHref={`/${tenant.slug}/mi-cita`} />
    </>
  );
}
