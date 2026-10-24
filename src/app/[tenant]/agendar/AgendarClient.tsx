"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarCheck } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { CalendarCell } from "@/components/ui/CalendarCell";
import {
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
import {
  getSlotsForDate,
  hasHoursOnWeekday,
  type AvailabilityRule,
} from "@/lib/availability";
import {
  isSlotBusy,
  isSlotPast,
  toBusyRanges,
  type BusyRange,
} from "@/lib/slots";
import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/lib/tenant";

const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function addDaysIso(isoDate: string, amount: number) {
  const next = parseIsoDate(isoDate);
  next.setDate(next.getDate() + amount);
  return toIsoDate(next);
}

function isClosedIso(rules: AvailabilityRule[], isoDate: string) {
  return !hasHoursOnWeekday(rules, parseIsoDate(isoDate).getDay());
}

// "Hoy" depende del dispositivo/reloj: se lee solo en el cliente.
const subscribeToNothing = () => () => {};
const getServerTodayIso = () => null;

type AgendarClientProps = {
  tenant: Tenant;
  rules: AvailabilityRule[];
};

export function AgendarClient({ tenant, rules }: AgendarClientProps) {
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
  const [busyRanges, setBusyRanges] = useState<BusyRange[] | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const [cuposError, setCuposError] = useState(false);

  // Cupos de un día: horario semanal menos citas, bloqueos y horas ya pasadas.
  const dayCupos = (iso: string) =>
    getSlotsForDate(rules, iso).filter(
      (time) =>
        !isSlotBusy(iso, time, busyRanges ?? []) &&
        !isSlotPast(iso, time, nowMs),
    ).length;

  // Un día queda cerrado si no tiene horario o si ya no quedan cupos
  // (bloqueado por el doctor, lleno o con todos sus horarios pasados).
  const isDayClosed = (iso: string) =>
    isClosedIso(rules, iso) || (busyRanges !== null && dayCupos(iso) === 0);

  const firstOpenIso = week.find((iso) => !isDayClosed(iso)) ?? null;
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
          .select("starts_at, ends_at")
          .eq("tenant_id", tenant.id)
          .lt("starts_at", rangeEnd.toISOString())
          .gt("ends_at", rangeStart.toISOString());

        if (cancelled) return;

        if (error || !data) {
          setCuposError(true);
          return;
        }

        setBusyRanges(
          toBusyRanges(data as { starts_at: string; ends_at: string }[]),
        );
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

  const cupos = selectedIso && busyRanges ? dayCupos(selectedIso) : null;

  const noHours = rules.length === 0;
  const canContinue = Boolean(selectedIso) && cupos !== 0;

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
              const state = isDayClosed(iso)
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

        {noHours ? (
          <Alert
            variant="warning"
            title="El consultorio aún no tiene horarios disponibles"
            description="Vuelve más tarde o contacta al consultorio."
          />
        ) : busyRanges !== null && week.every(isDayClosed) ? (
          <Alert
            variant="warning"
            title="No hay cupos esta semana"
            description="Vuelve pronto o contacta al consultorio."
          />
        ) : (
          <Alert
            variant="info"
            title="Selecciona un día y luego elige un horario disponible."
          />
        )}

        <Button
          variant={canContinue ? "primary" : "disabled"}
          href={
            canContinue && selectedIso
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
