"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { OTPInput } from "@/components/ui/OTPInput";
import { isValidIsoDate, isValidTime } from "@/lib/format-date";
import { MOCK_TENANT } from "@/lib/tenant-mock";
import HorarioPage from "../../horario/page";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 24;
const MOCK_CODE = "123456";

function formatPhone(digits: string) {
  return digits.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3");
}

function OtpCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");
  const phoneParam = searchParams.get("phone");
  const channel = searchParams.get("channel") === "sms" ? "SMS" : "WhatsApp";

  const date = dateParam && isValidIsoDate(dateParam) ? dateParam : null;
  const time = timeParam && isValidTime(timeParam) ? timeParam : null;
  const phone = phoneParam && /^\d{10}$/.test(phoneParam) ? phoneParam : null;

  const [open, setOpen] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const canResend = secondsLeft === 0;

  useEffect(() => {
    if (!date || !time) {
      router.replace(`/${MOCK_TENANT.slug}/agendar`);
      return;
    }
    if (!phone) {
      const params = new URLSearchParams({ date, time });
      router.replace(`/${MOCK_TENANT.slug}/agendar/otp?${params.toString()}`);
    }
  }, [date, time, phone, router]);

  useEffect(() => {
    if (canResend) return;

    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [canResend]);

  const handleClose = useCallback(() => {
    setOpen(false);
    router.back();
  }, [router]);

  function handleCodeChange(value: string) {
    setCode(value);
    if (error) setError(undefined);
  }

  function handleVerify() {
    if (!date || !time) return;

    if (code.length < CODE_LENGTH) {
      setError("Ingresa los 6 dígitos");
      return;
    }

    if (code === MOCK_CODE) {
      const params = new URLSearchParams({ date, time });
      router.push(`/${MOCK_TENANT.slug}/agendar/confirmar?${params.toString()}`);
      return;
    }

    setError("Código incorrecto. Inténtalo de nuevo.");
  }

  function handleResend() {
    setSecondsLeft(RESEND_SECONDS);
    setError(undefined);
  }

  if (!date || !time || !phone) return null;

  return (
    <>
      <HorarioPage />

      <BottomSheet
        open={open}
        onClose={handleClose}
        title="Ingresa el código de verificación"
        description={`Enviamos 6 dígitos por ${channel} al +52 ${formatPhone(phone)}.`}
      >
        <div className="flex flex-col gap-ds-6">
          <OTPInput
            length={CODE_LENGTH}
            value={code}
            onChange={handleCodeChange}
            error={error}
          />

          <div className="flex flex-col gap-ds-4">
            <Button variant="primary" onClick={handleVerify} className="w-full">
              Verificar
            </Button>

            <div
              role="status"
              aria-live="polite"
              className="flex min-h-[44px] items-center justify-center text-14"
            >
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="min-h-[44px] text-primary underline"
                >
                  Reenviar código
                </button>
              ) : (
                <p className="text-text-muted">
                  Reenviar código en 0:{secondsLeft.toString().padStart(2, "0")}
                </p>
              )}
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

export default function OtpCodePage() {
  return (
    <Suspense fallback={null}>
      <OtpCodeContent />
    </Suspense>
  );
}