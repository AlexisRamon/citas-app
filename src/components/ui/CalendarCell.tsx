import { LockKeyhole } from "lucide-react";

type CalendarCellState = "available" | "selected" | "closed";

type CalendarCellProps = {
  day: string;
  state: CalendarCellState;
  onClick?: () => void;
};

const stateClasses: Record<CalendarCellState, string> = {
  available: "bg-surface text-text",
  selected: "bg-primary text-surface font-bold",
  closed: "bg-disabled text-text-muted cursor-not-allowed",
};

const stateLabels: Record<CalendarCellState, string> = {
  available: "disponible",
  selected: "seleccionado",
  closed: "cerrado",
};

export function CalendarCell({ day, state, onClick }: CalendarCellProps) {
  const isClosed = state === "closed";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isClosed}
      aria-pressed={isClosed ? undefined : state === "selected"}
      aria-label={`Día ${day}, ${stateLabels[state]}`}
      className={`flex size-calendar-cell flex-col items-center justify-center gap-ds-1 rounded-sm text-16 ${stateClasses[state]}`}
    >
      <span>{day}</span>
      {isClosed ? (
        <LockKeyhole size={16} aria-hidden="true" />
      ) : (
        <span
          aria-hidden="true"
          className={`size-ds-1 rounded-full ${
            state === "selected" ? "bg-surface" : "bg-primary"
          }`}
        />
      )}
    </button>
  );
}