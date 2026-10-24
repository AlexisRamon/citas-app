"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Plus, Save, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { DateTimeInput } from "@/components/ui/DateTimeInput";
import {
  validateWindows,
  type AvailabilityRule,
  type TimeWindow,
} from "@/lib/availability";
import { saveSchedule } from "./actions";

type DayState = { open: boolean; windows: TimeWindow[] };

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const MAX_WINDOWS = 3;
const SLOT_STEP_SECONDS = 30 * 60;

function buildInitial(rules: AvailabilityRule[]): DayState[] {
  return Array.from({ length: 7 }, (_, weekday) => {
    const windows = rules
      .filter((rule) => rule.weekday === weekday)
      .map((rule) => ({ start: rule.start, end: rule.end }))
      .sort((a, b) => a.start.localeCompare(b.start));

    return {
      open: windows.length > 0,
      windows: windows.length > 0 ? windows : [{ start: "09:00", end: "12:00" }],
    };
  });
}

type ScheduleEditorProps = {
  initialRules: AvailabilityRule[];
};

export function ScheduleEditor({ initialRules }: ScheduleEditorProps) {
  const router = useRouter();

  const [days, setDays] = useState<DayState[]>(() => buildInitial(initialRules));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  const issues = days.map((day) => (day.open ? validateWindows(day.windows) : null));
  const hasIssues = issues.some(Boolean);
  const hasOpenDay = days.some((day) => day.open);

  function updateDay(weekday: number, change: (day: DayState) => DayState) {
    setDays((current) =>
      current.map((day, index) => (index === weekday ? change(day) : day)),
    );
    setSaved(false);
    setError(undefined);
  }

  async function handleSave() {
    if (saving || hasIssues) return;

    setSaving(true);
    setError(undefined);
    setSaved(false);

    const rules: AvailabilityRule[] = days.flatMap((day, weekday) =>
      day.open
        ? day.windows.map((window) => ({
            weekday,
            start: window.start,
            end: window.end,
          }))
        : [],
    );

    const result = await saveSchedule(rules);

    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-ds-4">
      {saved ? (
        <Alert
          variant="info"
          icon={CircleCheck}
          title="Horario guardado"
          description="Tus pacientes ya ven los nuevos horarios."
        />
      ) : null}
      {error ? <Alert variant="danger" title={error} /> : null}
      {!hasOpenDay ? (
        <Alert
          variant="warning"
          title="No hay ningún día abierto"
          description="Mientras tanto, los pacientes no podrán agendar."
        />
      ) : null}

      <ul className="flex flex-col gap-ds-3">
        {DAY_ORDER.map((weekday) => {
          const day = days[weekday];
          const label = DAY_LABELS[weekday];
          const issue = issues[weekday];

          return (
            <li
              key={weekday}
              className="flex flex-col gap-ds-3 rounded-md border border-border bg-surface p-ds-4"
            >
              <label className="flex min-h-[44px] items-center gap-ds-3 text-16 font-bold text-text">
                <input
                  type="checkbox"
                  checked={day.open}
                  onChange={(event) =>
                    updateDay(weekday, (current) => ({
                      ...current,
                      open: event.target.checked,
                    }))
                  }
                  className="size-[24px] accent-primary"
                />
                {label}
              </label>

              {day.open ? (
                <div className="flex flex-col gap-ds-3">
                  {day.windows.map((window, index) => (
                    <div key={index} className="flex flex-wrap items-end gap-ds-3">
                      <DateTimeInput
                        type="time"
                        step={SLOT_STEP_SECONDS}
                        label={`Desde (${label}, horario ${index + 1})`}
                        value={window.start}
                        onChange={(value) =>
                          updateDay(weekday, (current) => ({
                            ...current,
                            windows: current.windows.map((item, i) =>
                              i === index ? { ...item, start: value } : item,
                            ),
                          }))
                        }
                      />
                      <DateTimeInput
                        type="time"
                        step={SLOT_STEP_SECONDS}
                        label={`Hasta (${label}, horario ${index + 1})`}
                        value={window.end}
                        onChange={(value) =>
                          updateDay(weekday, (current) => ({
                            ...current,
                            windows: current.windows.map((item, i) =>
                              i === index ? { ...item, end: value } : item,
                            ),
                          }))
                        }
                      />
                      {day.windows.length > 1 ? (
                        <button
                          type="button"
                          aria-label={`Quitar horario ${index + 1} de ${label}`}
                          onClick={() =>
                            updateDay(weekday, (current) => ({
                              ...current,
                              windows: current.windows.filter((_, i) => i !== index),
                            }))
                          }
                          className="flex size-[56px] items-center justify-center rounded-sm text-text-muted hover:bg-surface-soft"
                        >
                          <X size={20} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  ))}

                  {issue ? (
                    <p role="alert" className="text-14 text-danger">
                      {issue}
                    </p>
                  ) : null}

                  {day.windows.length < MAX_WINDOWS ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateDay(weekday, (current) => ({
                          ...current,
                          windows: [...current.windows, { start: "16:00", end: "17:00" }],
                        }))
                      }
                      className="flex min-h-[44px] items-center gap-ds-2 self-start text-14 font-bold text-primary"
                    >
                      <Plus size={16} aria-hidden="true" />
                      Agregar horario
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="text-14 text-text-muted">Cerrado</p>
              )}
            </li>
          );
        })}
      </ul>

      <Button
        variant={saving || hasIssues ? "disabled" : "primary"}
        icon={<Save size={20} aria-hidden="true" />}
        onClick={handleSave}
        className="w-full lg:w-auto"
      >
        {saving ? "Guardando…" : "Guardar horario"}
      </Button>
    </div>
  );
}
