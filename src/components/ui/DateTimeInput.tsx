"use client";

import { useId } from "react";

type DateTimeInputProps = {
  label: string;
  type: "date" | "time";
  value: string;
  onChange: (value: string) => void;
  min?: string;
  step?: number;
  error?: string;
  hint?: string;
};

export function DateTimeInput({
  label,
  type,
  value,
  onChange,
  min,
  step,
  error,
  hint,
}: DateTimeInputProps) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div className="flex flex-col gap-ds-2">
      <label htmlFor={id} className="text-14 font-bold text-text">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        min={min}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={`h-control rounded-sm border bg-surface px-ds-4 text-16 text-text focus:outline-none focus:ring-2 ${
          error
            ? "border-danger focus:border-danger focus:ring-danger/20"
            : "border-border focus:border-primary focus:ring-primary/20"
        }`}
      />
      {error ? (
        <p id={messageId} role="alert" className="text-14 text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-14 text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
