"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff, CircleCheck, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { DateTimeInput } from "@/components/ui/DateTimeInput";
import { Input } from "@/components/ui/Input";
import { getClinicDateIso, getClinicTime } from "@/lib/clinic-time";
import { formatLongDate, formatTimeLabel } from "@/lib/format-date";
import { createBlock, deleteBlock } from "./actions";

export type BlockRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

type Mode = "dias" | "horas";

function describeBlock(block: BlockRow) {
  const startDate = getClinicDateIso(block.starts_at);
  const startTime = getClinicTime(block.starts_at);
  const endTime = getClinicTime(block.ends_at);

  if (startTime === "00:00" && endTime === "00:00") {
    const lastDate = getClinicDateIso(new Date(new Date(block.ends_at).getTime() - 1));

    return lastDate === startDate
      ? `${formatLongDate(startDate)} · todo el día`
      : `Del ${formatLongDate(startDate)} al ${formatLongDate(lastDate)}`;
  }

  return `${formatLongDate(startDate)} · ${formatTimeLabel(startTime)} a ${formatTimeLabel(endTime)}`;
}

type BlocksManagerProps = {
  blocks: BlockRow[];
  todayIso: string;
};

export function BlocksManager({ blocks, todayIso }: BlocksManagerProps) {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("dias");
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(todayIso);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  async function handleCreate() {
    if (busy) return;

    setBusy(true);
    setError(undefined);
    setNotice(undefined);

    const result = await createBlock({
      allDay: mode === "dias",
      startDate,
      endDate: mode === "dias" ? endDate : startDate,
      startTime,
      endTime,
      reason,
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setReason("");
    setNotice("Bloqueo creado. Esos horarios ya no se pueden reservar.");
    router.refresh();
  }

  async function handleDelete(block: BlockRow) {
    if (busy) return;

    if (!window.confirm("¿Quitar este bloqueo? Los horarios volverán a estar disponibles.")) {
      return;
    }

    setBusy(true);
    setError(undefined);
    setNotice(undefined);

    const result = await deleteBlock(block.id);

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setNotice("Bloqueo eliminado.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-ds-4">
      {notice ? (
        <Alert variant="info" icon={CircleCheck} title={notice} />
      ) : null}
      {error ? <Alert variant="danger" title={error} /> : null}

      <div className="flex flex-col gap-ds-4 rounded-md border border-border bg-surface p-ds-4">
        <div
          role="radiogroup"
          aria-label="Tipo de bloqueo"
          className="flex flex-wrap gap-ds-2"
        >
          {(
            [
              { value: "dias", label: "Día o varios días" },
              { value: "horas", label: "Rango de horas" },
            ] as const
          ).map((option) => {
            const active = mode === option.value;

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMode(option.value)}
                className={`flex min-h-[44px] items-center rounded-sm px-ds-4 text-16 ${
                  active
                    ? "bg-surface-soft font-bold text-primary"
                    : "text-text-muted hover:bg-surface-soft"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-end gap-ds-3">
          <DateTimeInput
            type="date"
            label={mode === "dias" ? "Desde" : "Fecha"}
            min={todayIso}
            value={startDate}
            onChange={(value) => {
              setStartDate(value);
              if (endDate < value) setEndDate(value);
            }}
          />
          {mode === "dias" ? (
            <DateTimeInput
              type="date"
              label="Hasta"
              min={startDate}
              value={endDate}
              onChange={setEndDate}
            />
          ) : (
            <>
              <DateTimeInput
                type="time"
                label="De"
                step={30 * 60}
                value={startTime}
                onChange={setStartTime}
              />
              <DateTimeInput
                type="time"
                label="A"
                step={30 * 60}
                value={endTime}
                onChange={setEndTime}
              />
            </>
          )}
        </div>

        <Input
          label="Motivo (opcional, solo lo ves tú)"
          placeholder="Ej. Vacaciones, congreso, cita personal"
          value={reason}
          onChange={setReason}
        />

        <Button
          variant={busy ? "disabled" : "primary"}
          icon={<CalendarOff size={20} aria-hidden="true" />}
          onClick={handleCreate}
          className="w-full lg:w-auto lg:self-start"
        >
          {busy ? "Guardando…" : "Bloquear"}
        </Button>
      </div>

      {blocks.length === 0 ? (
        <p className="text-14 text-text-muted">No tienes bloqueos próximos.</p>
      ) : (
        <ul className="flex flex-col gap-ds-2">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex items-center gap-ds-3 rounded-md border border-border bg-surface p-ds-4"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
                <p className="text-16 font-bold text-text">{describeBlock(block)}</p>
                {block.reason ? (
                  <p className="truncate text-14 text-text-muted">{block.reason}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(block)}
                disabled={busy}
                aria-label={`Quitar bloqueo: ${describeBlock(block)}`}
                className="flex size-[44px] shrink-0 items-center justify-center rounded-sm text-danger hover:bg-surface-soft"
              >
                <Trash2 size={20} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
