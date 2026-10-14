"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, CalendarPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import {
  formatLongDate,
  formatTimeLabel,
  isValidIsoDate,
  isValidTime,
} from "@/lib/format-date";
import { MOCK_TENANT } from "@/lib/tenant-mock";

function ConfirmarContent() {
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");
  const date = dateParam && isValidIsoDate(dateParam) ? dateParam : null;
  const time = timeParam && isValidTime(timeParam) ? timeParam : null;

  const dateTimeLabel =
    date && time
      ? `${formatLongDate(date)} · ${formatTimeLabel(time)}`
      : "Fecha por confirmar";

  const details = [
    { label: "Doctor", value: MOCK_TENANT.name },
    { label: "Fecha y hora", value: dateTimeLabel },
    { label: "Dirección", value: MOCK_TENANT.address },
    { label: "Teléfono", value: MOCK_TENANT.phone },
  ];

  return (
    <>
      <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pb-[calc(64px+var(--spacing-ds-6)+env(safe-area-inset-bottom))] pt-ds-3">
        <header className="flex items-center justify-between">
          <div
            aria-hidden="true"
            className="flex size-[48px] items-center justify-center rounded-md bg-surface-soft"
          >
            <span className="text-20 font-bold text-primary">
              {MOCK_TENANT.initials}
            </span>
          </div>
          <Badge variant="verificado" />
        </header>

        <section className="flex flex-col items-center gap-ds-3 pt-ds-4 text-center">
          <div
            aria-hidden="true"
            className="flex size-[88px] items-center justify-center rounded-full bg-surface-soft text-success"
          >
            <BadgeCheck size={48} />
          </div>
          <h1 className="text-24 font-bold text-text">¡Cita confirmada!</h1>
          <p className="text-14 text-text-muted">
            Tu cita está lista. Guarda los detalles para tu visita.
          </p>
        </section>

        <section
          aria-label="Detalles de la cita"
          className="rounded-md border border-border bg-surface p-ds-5"
        >
          <dl className="flex flex-col gap-ds-4">
            {details.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-16 text-text-muted">{label}</dt>
                <dd className="text-16 font-bold text-text">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="flex flex-col gap-ds-3">
          <Button
            variant="primary"
            icon={<CalendarPlus size={20} aria-hidden="true" />}
            className="w-full"
          >
            Añadir a mi calendario
          </Button>
          <Button variant="secondary" className="w-full">
            Compartir por WhatsApp
          </Button>
        </section>
      </main>

      <BottomNav activeHref={`/${MOCK_TENANT.slug}/home`} />
    </>
  );
}

export default function ConfirmarPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmarContent />
    </Suspense>
  );
}