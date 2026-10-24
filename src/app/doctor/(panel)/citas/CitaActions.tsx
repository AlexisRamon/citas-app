"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import type { AppointmentStatus } from "@/components/ui/AppointmentCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { cancelAppointment } from "./actions";

type CitaActionsProps = {
  id: string;
  status: AppointmentStatus;
  canMarkAttended: boolean;
};

type Notice = { tone: "ok" | "warn"; text: string };

export function CitaActions({ id, status, canMarkAttended }: CitaActionsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<Notice | undefined>(undefined);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAttended() {
    if (busy) return;

    setBusy(true);
    setError(undefined);

    const { error: updateError, count } = await supabase
      .from("appointments")
      .update({ status: "attended" }, { count: "exact" })
      .eq("id", id);

    if (updateError || !count) {
      setError("No pudimos actualizar la cita. Inténtalo de nuevo.");
      setBusy(false);
      return;
    }

    setBusy(false);
    router.refresh();
  }

  async function handleCancel() {
    if (busy) return;

    setBusy(true);
    setError(undefined);

    const result = await cancelAppointment(id, message);

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setConfirmingCancel(false);
    setNotice(
      result.emailSent
        ? { tone: "ok", text: "Cita cancelada. Avisamos al paciente por correo." }
        : {
            tone: "warn",
            text: "Cita cancelada, pero no pudimos avisar al paciente por correo. Avísale por otro medio.",
          },
    );
    router.refresh();
  }

  // Tras cancelar, la tarjeta ya no es "confirmed": se conserva solo el aviso.
  if (status !== "confirmed" && !notice) return null;

  return (
    <div className="flex flex-col items-end gap-ds-2">
      {status === "confirmed" && !confirmingCancel ? (
        <div className="flex flex-wrap items-center justify-end gap-ds-3">
          {canMarkAttended ? (
            <Button
              variant={busy ? "disabled" : "secondary"}
              icon={<Check size={20} aria-hidden="true" />}
              onClick={handleAttended}
            >
              Marcar atendida
            </Button>
          ) : null}
          <button
            type="button"
            onClick={() => setConfirmingCancel(true)}
            disabled={busy}
            className="flex min-h-[44px] items-center gap-ds-2 rounded-sm px-ds-4 text-16 font-bold text-danger"
          >
            <X size={20} aria-hidden="true" />
            Cancelar cita
          </button>
        </div>
      ) : null}

      {status === "confirmed" && confirmingCancel ? (
        <div className="flex w-full flex-col gap-ds-3 rounded-md border border-border bg-surface p-ds-4">
          <p className="text-14 font-bold text-text">
            ¿Cancelar esta cita? El horario quedará libre y avisaremos al
            paciente por correo.
          </p>
          <Input
            label="Mensaje para el paciente (opcional)"
            placeholder="Ej. Tuve una urgencia; te contactaremos para reagendar."
            hint="Se incluirá en el correo."
            value={message}
            onChange={setMessage}
          />
          <div className="flex flex-wrap items-center justify-end gap-ds-3">
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmingCancel(false);
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
              {busy ? "Cancelando…" : "Confirmar cancelación"}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-14 text-danger">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p
          role="status"
          className={`text-14 ${notice.tone === "ok" ? "text-success" : "text-warning"}`}
        >
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
