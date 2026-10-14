"use client";

import { Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  LockKeyhole,
  Plus,
  Sun,
  Sunset,
} from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import {
  formatLongDate,
  formatTimeLabel,
  isValidIsoDate,
} from "@/lib/format-date";
import {
  AFTERNOON_SLOTS,
  MORNING_SLOTS,
  getBusySlots,
  isKnownSlot,
} from "@/lib/slots-mock";
import { MOCK_TENANT } from "@/lib/tenant-mock";

function HorarioSkeleton() {
  return (
    <>
      <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pt-ds-3">
        <div className="h-[44px] w-full" />
        <div className="h-[60px] w-full rounded-md bg-surface-soft" />
        <div className="grid grid-cols-2 gap-ds-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[56px] rounded-md bg-surface-soft" />
          ))}
        </div>
      </main>
      <BottomNav activeHref={`/${MOCK_TENANT.slug}/home`} />
    </>
  );
}

type SlotGroupProps = {
  id: string;
  label: string;
  icon: ReactNode;
  children: ReactNode;
};

function SlotGroup({ id, label, icon, children }: SlotGroupProps) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-ds-3">
      <h2
        id={id}
        className="flex items-center gap-ds-2 text-14 font-bold text-text-muted"
      >
        {icon}
        {label}
      </h2>
      <ul className="grid grid-cols-2 gap-ds-3">{children}</ul>
    </section>
  );
}

function HorarioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");
  const date = dateParam && isValidIsoDate(dateParam) ? dateParam : null;

  const [selectedSlot, setSelectedSlot] = useState<string | null>(() => {
    if (!date || !timeParam || !isKnownSlot(timeParam)) return null;
    return getBusySlots(date).has(timeParam) ? null : timeParam;
  });

  useEffect(() => {
    if (!date) router.replace(`/${MOCK_TENANT.slug}/agendar`);
  }, [date, router]);

  if (!date) return <HorarioSkeleton />;

  const busySlots = getBusySlots(date);

  function renderSlot(time: string) {
    const label = formatTimeLabel(time);

    if (busySlots.has(time)) {
      return (
        <li key={time}>
          <Button
            variant="disabled"
            icon={<LockKeyhole size={16} aria-hidden="true" />}
            className="w-full line-through"
          >
            {label}
            <span className="sr-only">, ocupado</span>
          </Button>
        </li>
      );
    }

    const isSelected = selectedSlot === time;

    return (
      <li key={time}>
        <Button
          variant={isSelected ? "primary" : "secondary"}
          icon={
            isSelected ? (
              <CircleCheck size={16} aria-hidden="true" />
            ) : (
              <Plus size={16} aria-hidden="true" />
            )
          }
          onClick={() => setSelectedSlot(time)}
          className="w-full"
        >
          {label}
          <span className="sr-only">
            {isSelected ? ", seleccionado" : ", disponible"}
          </span>
        </Button>
      </li>
    );
  }

  const continueHref = selectedSlot
    ? `/${MOCK_TENANT.slug}/agendar/otp?${new URLSearchParams({
        date,
        time: selectedSlot,
      }).toString()}`
    : undefined;

  return (
    <>
      <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pb-[calc(64px+var(--spacing-ds-6)+env(safe-area-inset-bottom))] pt-ds-3">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Cambiar fecha"
            className="flex size-[44px] items-center justify-center rounded-sm bg-surface text-text"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
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
          <h1 className="text-24 font-bold text-text">Elige un horario</h1>
          <div className="flex items-center justify-between gap-ds-3">
            <p className="text-14 text-text-muted">{formatLongDate(date)}</p>
            <button
              type="button"
              onClick={() => router.back()}
              className="min-h-[44px] text-14 font-bold text-primary underline"
            >
              Cambiar fecha
            </button>
          </div>
        </section>

        <SlotGroup
          id="franja-manana"
          label="Mañana"
          icon={<Sun size={16} aria-hidden="true" />}
        >
          {MORNING_SLOTS.map(renderSlot)}
        </SlotGroup>

        <SlotGroup
          id="franja-tarde"
          label="Tarde"
          icon={<Sunset size={16} aria-hidden="true" />}
        >
          {AFTERNOON_SLOTS.map(renderSlot)}
        </SlotGroup>

        <div className="mt-auto flex flex-col gap-ds-3">
          <p className="text-center text-14 text-text-muted">
            Toca un horario para continuar. Verificarás tu teléfono al
            confirmar.
          </p>
          <Button
            variant={selectedSlot ? "primary" : "disabled"}
            href={continueHref}
            icon={<ArrowRight size={20} aria-hidden="true" />}
            className="w-full"
          >
            Continuar
          </Button>
        </div>
      </main>

      <BottomNav activeHref={`/${MOCK_TENANT.slug}/home`} />
    </>
  );
}

export default function HorarioPage() {
  return (
    <Suspense fallback={<HorarioSkeleton />}>
      <HorarioContent />
    </Suspense>
  );
}