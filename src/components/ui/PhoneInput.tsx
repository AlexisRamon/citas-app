"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";

type PhoneInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
};

export function PhoneInput({
  label = "Número de celular",
  value,
  onChange,
  error,
  placeholder,
}: PhoneInputProps) {
  const id = useId();
  const prefixId = `${id}-prefix`;
  const errorId = `${id}-error`;
  const describedBy = error ? `${prefixId} ${errorId}` : prefixId;

  return (
    <div className="flex flex-col gap-ds-2">
      <label htmlFor={id} className="text-14 font-bold text-text">
        {label}
      </label>
      <div
        className={`flex h-control items-center rounded-sm border bg-surface focus-within:ring-2 ${
          error
            ? "border-danger focus-within:border-danger focus-within:ring-danger/20"
            : "border-border focus-within:border-primary focus-within:ring-primary/20"
        }`}
      >
        <div
          id={prefixId}
          className="flex h-full items-center gap-ds-2 border-r border-border pl-ds-4 pr-ds-3"
        >
          <span className="text-14 font-bold text-text-muted">MX</span>
          <span className="text-16 text-text">+52</span>
        </div>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className="ml-ds-2 shrink-0 text-text-muted"
        />
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-full min-w-0 flex-1 bg-transparent px-ds-4 text-16 text-text outline-none placeholder:text-text-muted"
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-14 text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}