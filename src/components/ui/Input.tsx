"use client";

import { useId } from "react";

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  type?: "text" | "email" | "tel" | "password" | "number" | "search" | "url";
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  autoComplete?: string;
  required?: boolean;
  id?: string;
  name?: string;
};

export function Input({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  type = "text",
  inputMode,
  autoComplete,
  required,
  id,
  name,
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-ds-2">
      <label htmlFor={inputId} className="text-14 font-bold text-text">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`h-control rounded-sm border bg-surface px-ds-4 text-16 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 ${
          error
            ? "border-danger focus:border-danger focus:ring-danger/20"
            : "border-border focus:border-primary focus:ring-primary/20"
        }`}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-14 text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-14 text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}