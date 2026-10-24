"use client";

import { useEffect, useState } from "react";
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
import { Alert } from "@/components/ui/Alert";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import {
  formatLongDate,
  formatTimeLabel,
  isValidIsoDate,
  isValidTime,
} from "@/lib/format-date";
import {
  getNowMs,
  zonedDateTimeToUtc,
} from "@/lib/clinic-time";
import {
  getSlotsForDate,
  splitByPeriod,
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

export function HorarioSkeleton({ slug }: { slug: string }) {
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
      <BottomNav slug={slug} activeHref={`/${slug}/home`} />
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

type HorarioClientProps = {
  tenant: Tenant;
  rules: AvailabilityRule[];
};

export function HorarioClient({ tenant, rules }: HorarioClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");
  const date = dateParam && isValidIsoDate(dateParam) ? dateParam : null;

  const [selectedSlot, setSelectedSlot] = useState<string | null>(() =>
    timeParam && isValidTime(timeParam) ? timeParam : null,
  );
  const [busyRanges, setBusyRanges] = useState<BusyRange[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    if (!date) router.replace(`/${tenant.slug}/agendar`);
  }, [date, router, tenant.slug]);

  useEffect(() => {
    if (!date) return;

    let cancelled = false;

    async function loadBusySlots(isoDate: string) {
      try {
        const supabase = createClient();
        const dayStart = zonedDateTimeToUtc(isoDate, "00:00:00");
        const dayEnd = zonedDateTimeToUtc(isoDate, "23:59:59");

        const { data, error } = await supabase
          .from("public_busy_slots")
          .select("starts_at, ends_at")
          .eq("tenant_id", tenant.id)
          .lt("starts_at", dayEnd.toISOString())
          .gt("ends_at", dayStart.toISOString());

        if (cancelled) return;

        if (error || !data) {
          setLoadError(true);
          setLoadingSlots(false);
          return;
        }

        setBusyRanges(
          toBusyRanges(data as { starts_at: string; ends_at: string }[]),
        );
        setNowMs(getNowMs());
        setLoadError(false);
        setLoadingSlots(false);
      } catch {
        if (cancelled) return;
        setLoadError(true);
        setLoadingSlots(false);
      }
    }

    loadBusySlots(date);

    return () => {
      cancelled = true;
    };
  }, [date, tenant.id, reloadKey]);

  function handleRetry() {
    setLoadError(false);
    setLoadingSlots(true);
    setReloadKey((current) => current + 1);
  }

  if (!date || loadingSlots) return <HorarioSkeleton slug={tenant.slug} />;

  const slots = getSlotsForDate(rules, date);
  const { morning, afternoon } = splitByPeriod(slots);

  const isUnavailable = (time: string) =>
    isSlotBusy(date, time, busyRanges) || isSlotPast(date, time, nowMs);

  const activeSlot =
    selectedSlot &&
    slots.includes(selectedSlot) &&
    !isUnavailable(selectedSlot)
      ? selectedSlot
      : null;

  function renderSlot(time: string) {
    const label = formatTimeLabel(time);

    if (isUnavailable(time)) {
      return (
        <li key={time}>
          <Button
            variant="disabled"
            icon={<LockKeyhole size={16} aria-hidden="true" />}
            className="w-full line-through"
          >
            {label}
            <span className="sr-only">, no disponible</span>
          </Button>
        </li>
      );
    }

    const isSelected = activeSlot === time;

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

  const continueHref = activeSlot
    ? `/${tenant.slug}/agendar/resumen?${new URLSearchParams({
        date,
        time: activeSlot,
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

        {loadError ? (
          <div className="flex flex-col gap-ds-4">
            <Alert
              variant="danger"
              title="No pudimos cargar los horarios"
              description="Revisa tu conexión e inténtalo de nuevo."
            />
            <Button
              variant="secondary"
              onClick={handleRetry}
              className="w-full"
            >
              Reintentar
            </Button>
          </div>
        ) : slots.length === 0 ? (
          <Alert
            variant="info"
            title="Este día no hay atención"
            description="Elige otra fecha."
          />
        ) : (
          <>
            {morning.length > 0 ? (
              <SlotGroup
                id="franja-manana"
                label="Mañana"
                icon={<Sun size={16} aria-hidden="true" />}
              >
                {morning.map(renderSlot)}
              </SlotGroup>
            ) : null}

            {afternoon.length > 0 ? (
              <SlotGroup
                id="franja-tarde"
                label="Tarde"
                icon={<Sunset size={16} aria-hidden="true" />}
              >
                {afternoon.map(renderSlot)}
              </SlotGroup>
            ) : null}
          </>
        )}

        <div className="mt-auto flex flex-col gap-ds-3">
          <p className="text-center text-14 text-text-muted">
            Toca un horario para continuar.
          </p>
          <Button
            variant={activeSlot ? "primary" : "disabled"}
            href={continueHref}
            icon={<ArrowRight size={20} aria-hidden="true" />}
            className="w-full"
          >
            Continuar
          </Button>
        </div>
      </main>

      <BottomNav slug={tenant.slug} activeHref={`/${tenant.slug}/home`} />
    </>
  );
}