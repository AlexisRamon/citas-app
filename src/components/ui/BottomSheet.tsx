"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
};

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  description,
}: BottomSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-text/40 backdrop-blur-[2px] transition-[opacity,visibility] duration-300 ease-out ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        inert={!open}
        className={`fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-lg bg-surface p-ds-6 pb-[calc(var(--spacing-ds-6)+env(safe-area-inset-bottom))] transition-[transform,visibility] duration-300 ease-out focus:outline-none ${
          open ? "visible translate-y-0" : "invisible translate-y-full"
        }`}
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-ds-5 h-[4px] w-[40px] rounded-sm bg-border"
        />
        {title || description ? (
          <header className="mb-ds-5 flex flex-col gap-ds-2">
            {title ? (
              <h2 id={titleId} className="text-20 font-bold text-text">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id={descriptionId} className="text-14 text-text-muted">
                {description}
              </p>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </>
  );
}