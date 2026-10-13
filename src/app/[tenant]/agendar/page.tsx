"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleCheck, LockKeyhole, Plus } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { CalendarCell } from "@/components/ui/CalendarCell";

const TENANT = {
  slug: "dr-guzman",
  name: "Dr. Guzmán",
  initials: "DG",
};

const WEEKDAYS_LONG = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const SLOT_TIMES = [
  "9:00 a. m.",
  "9:30 a. m.",
  "10:00 a. m.",
  "10:30 a. m.",
  "11:00 a. m.",
  "11:30 a. m.",
  "4:00 p. m.",
  "4:30 p. m.",
];

type SlotState = "available" | "ocupado";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isClosed(date: Date) {
  const weekday = date.getDay();
  return weekday === 0 || weekday === 3;
}

function formatLongDate(date: Date) {
  return `${WEEKDAYS_LONG[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

function getSlots(date: Date): { time: string; state: SlotState }[] {
  return SLOT_TIMES.map((time, index) => ({
    time,
    state: (index + date.getDate()) % 3 === 0 ? "ocupado" : "available",
  }));
}

export default function AgendarPage() {
  const [week, setWeek] = useState<Date[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Calcula las fechas solo en el cliente (evita el error de prerender)
  useEffect(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    setWeek(days);
    const firstOpen = days.find((d) => !isClosed(d)) ?? days[0];
    setSelectedDay(firstOpen);
  }, []);

  const slots = selectedDay ? getSlots(selectedDay) : [];

  function handleSelectDay(day: Date) {
    if (isClosed(day)) return;
    setSelectedDay(day);
    setSelectedSlot(null);
  }

  function handleSelectSlot(time: string) {
    setSelectedSlot(time);
    console.log("Horario seleccionado:", {
      day: selectedDay ? formatLongDate(selectedDay) : "",
      time,
    });
  }

  // Mientras carga en el cliente, mostramos un skeleton mínimo
  if (!selectedDay) {
    return (
      <>
        <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pt-ds-3">
          <div className="h-[44px] w-full" />
          <div className="h-[60px] w-full rounded-md bg-surface-soft" />
          <div className="h-[72px] w-full rounded-md bg-surface-soft" />
          <div className="grid grid-cols-2 gap-ds-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[56px] rounded-md bg-surface-soft" />
            ))}
          </div>
        </main>
        <BottomNav activeHref="/dr-guzman/home" />
      </>
    );
  }

  return (
    <>
      <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pb-[calc(64px+var(--spacing-ds-6)+env(safe-area-inset-bottom))] pt-ds-3">
        <header className="flex items-center justify-between">
          <Link
            href={`/${TENANT.slug}/home`}
            aria-label="Volver al inicio"
            className="flex size-[44px] items-center justify-center rounded-sm bg-surface text-text"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </Link>
          <p className="text-14 font-bold text-text">{TENANT.name}</p>
          <div
            aria-hidden="true"
            className="flex size-[40px] items-center justify-center rounded-md bg-surface-soft"
          >
            <span className="text-16 font-bold text-primary">
              {TENANT.initials}
            </span>
          </div>
        </header>

        <section className="flex flex-col gap-ds-2">
          <h1 className="text-24 font-bold text-text">Elige una hora</h1>
          <p className="text-14 text-text-muted">{formatLongDate(selectedDay)}</p>
        </section>

        <section aria-label="Días disponibles">
          <ul className="-mx-ds-6 flex gap-ds-2 overflow-x-auto px-ds-6 pb-ds-1">
            {week.map((day) => {
              const state = isClosed(day)
                ? "closed"
                : isSameDay(day, selectedDay)
                  ? "selected"
                  : "available";

              return (
                <li
                  key={day.toISOString()}
                  className="flex shrink-0 flex-col items-center gap-ds-1"
                >
                  <span className="text-14 text-text-muted">
                    {WEEKDAYS_SHORT[day.getDay()]}
                  </span>
                  <CalendarCell
                    day={String(day.getDate())}
                    state={state}
                    onClick={() => handleSelectDay(day)}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-label="Horarios del día">
          <ul className="grid grid-cols-2 gap-ds-3">
            {slots.map(({ time, state }) => {
              const isSelected = selectedSlot === time;

              if (state === "ocupado") {
                return (
                  <li key={time}>
                    <Button
                      variant="disabled"
                      icon={<LockKeyhole size={16} />}
                      className="w-full line-through"
                    >
                      {time}
                      <span className="sr-only">, ocupado</span>
                    </Button>
                  </li>
                );
              }

              return (
                <li key={time}>
                  <Button
                    variant={isSelected ? "primary" : "secondary"}
                    icon={
                      isSelected ? <CircleCheck size={16} /> : <Plus size={16} />
                    }
                    onClick={() => handleSelectSlot(time)}
                    className="w-full"
                  >
                    {time}
                    <span className="sr-only">
                      {isSelected ? ", seleccionado" : ", disponible"}
                    </span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="text-center text-14 text-text-muted">
          Toca un horario para continuar. Verificarás tu teléfono al confirmar.
        </p>
      </main>

      <BottomNav activeHref="/dr-guzman/home" />
    </>
  );
}