"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MIN_CANCEL_HOURS } from "@/lib/booking";
import { cancelMyAppointment } from "./actions";

type CancelAppointmentButtonProps = {
  slug: string;
  id: string;
  tooLate: boolean;
  phone: string;
  onCancelled: () => void;
};

export function CancelAppointmentButton({
  slug,
  id,
  tooLate,
  phone,
  onCancelled,
}: CancelAppointmentButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  async function handleCancel() {
    if (busy) return;

    setBusy(true);
    setError(undefined);

    const result = await cancelMyAppointment(slug, id);

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onCancelled();
  }

  if (tooLate) {
    return (
      <p className="text-14 text-text-muted">
        Para cancelar con menos de {MIN_CANCEL_HOURS} horas de anticipación,
        contacta al consultorio{phone ? `: ${phone}` : ""}.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-ds-2">
      {confirming ? (
        <div className="flex flex-col gap-ds-3 rounded-md border border-border bg-surface p-ds-4">
          <p className="text-14 font-bold text-text">
            ¿Cancelar esta cita? El horario quedará libre y avisaremos al
            consultorio.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-ds-3">
            <Button
              variant="secondary"
              onClick={() => {
                setConfirming(false);
                setError(undefined);
              }}
            >
              Volver
            </Button>
            <Button
              variant={busy ? "disabled" : "primary"}
              icon={<X size={20} aria-hidden="true" />}
              onClick={handleCancel}
            >
              {busy ? "Cancelando…" : "Sí, cancelar"}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex min-h-[44px] items-center gap-ds-2 self-end rounded-sm px-ds-4 text-16 font-bold text-danger"
        >
          <X size={20} aria-hidden="true" />
          Cancelar cita
        </button>
      )}

      {error ? (
        <p role="alert" className="text-14 text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
