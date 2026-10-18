"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarCheck } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { CalendarCell } from "@/components/ui/CalendarCell";
import {
  getClinicDateIso,
  getClinicTime,
  getClinicTodayIso,
  getNowMs,
  zonedDateTimeToUtc,
} from "@/lib/clinic-time";
import {
  formatDateRange,
  formatLongDate,
  parseIsoDate,
  toIsoDate,
} from "@/lib/format-date";
import { ALL_SLOTS, isSlotPast } from "@/lib/slots";
import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/lib/tenant";

const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const CLOSED_WEEKDAYS = [0, 2];

function addDaysIso(isoDate: string, amount: number) {
  const next = parseIsoDate(isoDate);
  next.setDate(next.getDate() + amount);
  return toIsoDate(next);
}

function isClosedIso(isoDate: string) {
  return CLOSED_WEEKDAYS.includes(parseIsoDate(isoDate).getDay());
}

// "Hoy" depende del dispositivo/reloj: se lee solo en el cliente.
const subscribeToNothing = () => () => {};
const getServerTodayIso = () => null;

type AgendarClientProps = {
  tenant: Tenant;
};

export function AgendarClient({ tenant }: AgendarClientProps) {
  const todayIso = useSyncExternalStore(
    subscribeToNothing,
    getClinicTodayIso,
    getServerTodayIso,
  );

  const week = useMemo(
    () =>
      todayIso ? Array.from({ length: 7 }, (_, i) => addDaysIso(todayIso, i)) : [],
    [todayIso],
  );

  const [pickedIso, setPickedIso] = useState<string | null>(null);
  const [busyByDate, setBusyByDate] = useState<Record<string, Set<string>> | null>(
    null,
  );
  const [nowMs, setNowMs] = useState(0);
  const [cuposError, setCuposError] = useState(false);

  const firstOpenIso = week.find((iso) => !isClosedIso(iso)) ?? null;
  const selectedIso = pickedIso ?? firstOpenIso;

  useEffect(() => {
    if (week.length === 0) return;

    let cancelled = false;

    async function loadBusy() {
      try {
        const supabase = createClient();
        const rangeStart = zonedDateTimeToUtc(week[0], "00:00:00");
        const rangeEnd = zonedDateTimeToUtc(
          addDaysIso(week[week.length - 1], 1),
          "00:00:00",
        );

        const { data, error } = await supabase
          .from("public_busy_slots")
          .select("starts_at")
          .eq("tenant_id", tenant.id)
          .gte("starts_at", rangeStart.toISOString())
          .lt("starts_at", rangeEnd.toISOString());

        if (cancelled) return;

        if (error || !data) {
          setCuposError(true);
          return;
        }

        const byDate: Record<string, Set<string>> = {};
        for (const row of data as { starts_at: string }[]) {
          const iso = getClinicDateIso(row.starts_at);
          (byDate[iso] ??= new Set()).add(getClinicTime(row.starts_at));
        }

        setBusyByDate(byDate);
        setNowMs(getNowMs());
        setCuposError(false);
      } catch {
        if (!cancelled) setCuposError(true);
      }
    }

    loadBusy();

    return () => {
      cancelled = true;
    };
  }, [week, tenant.id]);

  if (week.length === 0) {
    return (
      <>
        <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pt-ds-3">
          <div className="h-[44px] w-full" />
          <div className="h-[60px] w-full rounded-md bg-surface-soft" />
          <div className="h-[96px] w-full rounded-md bg-surface-soft" />
          <div className="h-[84px] w-full rounded-md bg-surface-soft" />
        </main>
        <BottomNav slug={tenant.slug} activeHref={`/${tenant.slug}/home`} />
      </>
    );
  }

  const rangeLabel = formatDateRange(week[0], week[week.length - 1]);

  const cupos =
    selectedIso && busyByDate
      ? ALL_SLOTS.filter(
          (time) =>
            !busyByDate[selectedIso]?.has(time) &&
            !isSlotPast(selectedIso, time, nowMs),
        ).length
      : null;

  return (
    <>
      <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pb-[calc(64px+var(--spacing-ds-6)+env(safe-area-inset-bottom))] pt-ds-3">
        <header className="flex items-center justify-between">
          <Link
            href={`/${tenant.slug}/home`}
            aria-label="Volver al inicio"
            className="flex size-[44px] items-center justify-center rounded-sm bg-surface text-text"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </Link>
          <p className="text-14 font-bold text-text">{tenant.name}</p>
          <div
            aria-hidden="true"
            className="flex size-[40px] items-center justify-center rounded-md bg-surface-soft"
          >
            <span className="text-16 font-bold text-primary">
              {tenant.initials}
            </span>
          </div>
        </header>

        <section className="flex flex-col gap-ds-2">
          <h1 className="text-24 font-bold text-text">Elige una fecha</h1>
          <p className="text-14 text-text-muted">{rangeLabel}</p>
        </section>

        <section aria-label="Días disponibles">
          <ul className="-mx-ds-6 flex gap-ds-2 overflow-x-auto px-ds-6 pb-ds-1">
            {week.map((iso) => {
              const day = parseIsoDate(iso);
              const state = isClosedIso(iso)
                ? "closed"
                : iso === selectedIso
                  ? "selected"
                  : "available";

              return (
                <li
                  key={iso}
                  className="flex shrink-0 flex-col items-center gap-ds-1"
                >
                  <span className="text-14 text-text-muted">
                    {WEEKDAYS_SHORT[day.getDay()]}
                  </span>
                  <CalendarCell
                    day={String(day.getDate())}
                    state={state}
                    onClick={() => setPickedIso(iso)}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        {selectedIso ? (
          <section
            aria-label="Día seleccionado"
            aria-live="polite"
            className="flex items-start gap-ds-3 rounded-md border border-border bg-surface p-ds-4"
          >
            <CalendarCheck
              size={20}
              aria-hidden="true"
              className="mt-ds-1 shrink-0 text-primary"
            />
            <div className="flex flex-col">
              <p className="text-16 font-bold text-text">
                {formatLongDate(selectedIso)}
              </p>
              <p className="text-14 text-text-muted">
                {cupos === null
                  ? cuposError
                    ? "No pudimos consultar la disponibilidad."
                    : "Consultando disponibilidad…"
                  : `${cupos} ${cupos === 1 ? "cupo disponible" : "cupos disponibles"}`}
              </p>
            </div>
          </section>
        ) : null}

        <Alert
          variant="info"
          title="Selecciona un día y luego elige un horario disponible."
        />

        <Button
          variant={selectedIso ? "primary" : "disabled"}
          href={
            selectedIso
              ? `/${tenant.slug}/agendar/horario?date=${selectedIso}`
              : undefined
          }
          icon={<ArrowRight size={20} aria-hidden="true" />}
          className="mt-auto w-full"
        >
          Continuar
        </Button>
      </main>

      <BottomNav slug={tenant.slug} activeHref={`/${tenant.slug}/home`} />
    </>
  );
}
