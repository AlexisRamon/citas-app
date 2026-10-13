"use client";

import { useId, useRef } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";

type OTPInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function OTPInput({ length = 6, value, onChange, error }: OTPInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  function focusInput(index: number) {
    const target = Math.max(0, Math.min(index, length - 1));
    inputsRef.current[target]?.focus();
  }

  function handleChange(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    if (!digit) return;

    const position = Math.min(index, value.length);
    onChange(value.slice(0, position) + digit + value.slice(position + 1));
    focusInput(position + 1);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (value[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1));
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index));
        focusInput(index - 1);
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusInput(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusInput(index + 1);
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;

    const position = Math.min(index, value.length);
    const next = (value.slice(0, position) + pasted).slice(0, length);
    onChange(next);
    focusInput(next.length);
  }

  return (
    <div className="flex flex-col gap-ds-2">
      <div
        role="group"
        aria-label="Código de verificación"
        aria-describedby={error ? errorId : undefined}
        className="flex justify-center gap-ds-2"
      >
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(element) => {
              inputsRef.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            value={value[index] ?? ""}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            onFocus={(event) => event.target.select()}
            aria-label={`Dígito ${index + 1} de ${length}`}
            aria-invalid={error ? true : undefined}
            className={`aspect-square min-w-0 max-w-[50px] flex-1 rounded-sm border bg-surface text-center text-24 font-bold text-text focus:outline-none focus:ring-2 ${
              error
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : "border-border focus:border-primary focus:ring-primary/20"
            }`}
          />
        ))}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-center text-14 text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}