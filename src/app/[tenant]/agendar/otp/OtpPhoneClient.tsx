"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import {
  formatLongDate,
  formatTimeLabel,
  isValidIsoDate,
  isValidTime,
} from "@/lib/format-date";
import type { Tenant } from "@/lib/tenant";
import { HorarioClient } from "../horario/HorarioClient";

type Channel = "whatsapp" | "sms";

type OtpPhoneClientProps = {
  tenant: Tenant;
};

export function OtpPhoneClient({ tenant }: OtpPhoneClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");
  const date = dateParam && isValidIsoDate(dateParam) ? dateParam : null;
  const time = timeParam && isValidTime(timeParam) ? timeParam : null;

  const [open, setOpen] = useState(true);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!date || !time) router.replace(`/${tenant.slug}/agendar`);
  }, [date, time, router, tenant.slug]);

  const handleClose = useCallback(() => {
    setOpen(false);
    router.back();
  }, [router]);

  function handlePhoneChange(value: string) {
    setPhone(value);
    if (error) setError(undefined);
  }

  function handleSend(channel: Channel) {
    if (!date || !time) return;

    if (phone.length < 10) {
      setError("Ingresa un número válido");
      return;
    }

    const params = new URLSearchParams({ date, time, phone, channel });
    router.push(`/${tenant.slug}/agendar/otp/codigo?${params.toString()}`);
  }

  if (!date || !time) return null;

  return (
    <>
      <Suspense fallback={null}>
        <HorarioClient tenant={tenant} />
      </Suspense>

      <BottomSheet
        open={open}
        onClose={handleClose}
        title="Verifica tu número para confirmar"
        description={`${formatLongDate(date)} · ${formatTimeLabel(time)}`}
      >
        <div className="flex flex-col gap-ds-5">
          <div className="flex flex-col gap-ds-2">
            <PhoneInput
              value={phone}
              onChange={handlePhoneChange}
              error={error}
              placeholder="311 123 4567"
            />
            {error ? null : (
              <p className="text-14 text-text-muted">
                Te enviaremos un código de verificación.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-ds-3">
            <Button
              variant="primary"
              onClick={() => handleSend("whatsapp")}
              className="w-full"
            >
              Enviar código por WhatsApp
            </Button>
            <button
              type="button"
              onClick={() => handleSend("sms")}
              className="min-h-[44px] text-center text-14 text-primary underline"
            >
              Prefiero SMS
            </button>
          </div>

          <p className="text-center text-14 text-text-muted">
            Al continuar, aceptas el aviso de privacidad. Usaremos tu número solo
            para verificar tu cita y enviarte recordatorios.
          </p>
        </div>
      </BottomSheet>
    </>
  );
}