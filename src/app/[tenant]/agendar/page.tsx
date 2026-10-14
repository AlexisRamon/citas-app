"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarCheck } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { CalendarCell } from "@/components/ui/CalendarCell";
import {
  formatDateRange,
  formatLongDate,
  toIsoDate,
} from "@/lib/format-date";
import { getAvailableCount } from "@/lib/slots-mock";
import { MOCK_TENANT } from "@/lib/tenant-mock";

const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isClosed(date: Date) {
  const weekday = date.getDay();
  return weekday === 0 || weekday === 3;
}

export default function AgendarPage() {
  const [week, setWeek] = useState<Date[]>([]);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  // Las fechas se calculan solo en el cliente (evita errores de prerender)
  useEffect(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    const firstOpen = days.find((d) => !isClosed(d)) ?? null;
    setWeek(days);
    setSelectedIso(firstOpen ? toIsoDate(firstOpen) : null);
  }, []);

  if (week.length === 0) {
    return (
      <>
        <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pt-ds-3">
          <div className="h-[44px] w-full" />
          <div className="h-[60px] w-full rounded-md bg-surface-soft" />
          <div className="h-[96px] w-full rounded-md bg-surface-soft" />
          <div className="h-[84px] w-full rounded-md bg-surface-soft" />
        </main>
        <BottomNav activeHref={`/${MOCK_TENANT.slug}/home`} />
      </>
    );
  }

  const rangeLabel = formatDateRange(
    toIsoDate(week[0]),
    toIsoDate(week[week.length - 1]),
  );
  const cupos = selectedIso ? getAvailableCount(selectedIso) : 0;

  return (
    <>
      <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pb-[calc(64px+var(--spacing-ds-6)+env(safe-area-inset-bottom))] pt-ds-3">
        <header className="flex items-center justify-between">
          <Link
            href={`/${MOCK_TENANT.slug}/home`}
            aria-label="Volver al inicio"
            className="flex size-[44px] items-center justify-center rounded-sm bg-surface text-text"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </Link>
          <p className="text-14 font-bold text-text">{MOCK_TENANT.name}</p>
          <div
            aria-hidden="true"
            className="flex size-[40px] items-center justify-center rounded-md bg-surface-soft"
          >
            <span className="text-16 font-bold text-primary">
              {MOCK_TENANT.initials}
            </span>
          </div>
        </header>

        <section className="flex flex-col gap-ds-2">
          <h1 className="text-24 font-bold text-text">Elige una fecha</h1>
          <p className="text-14 text-text-muted">{rangeLabel}</p>
        </section>

        <section aria-label="Días disponibles">
          <ul className="-mx-ds-6 flex gap-ds-2 overflow-x-auto px-ds-6 pb-ds-1">
            {week.map((day) => {
              const iso = toIsoDate(day);
              const state = isClosed(day)
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
                    onClick={() => setSelectedIso(iso)}
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
                {cupos} {cupos === 1 ? "cupo disponible" : "cupos disponibles"}
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
              ? `/${MOCK_TENANT.slug}/agendar/horario?date=${selectedIso}`
              : undefined
          }
          icon={<ArrowRight size={20} aria-hidden="true" />}
          className="mt-auto w-full"
        >
          Continuar
        </Button>
      </main>

      <BottomNav activeHref={`/${MOCK_TENANT.slug}/home`} />
    </>
  );
}