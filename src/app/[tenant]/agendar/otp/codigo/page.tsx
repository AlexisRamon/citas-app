"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { OTPInput } from "@/components/ui/OTPInput";
import AgendarPage from "../../page";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 24;
const MOCK_CODE = "123456";
const MOCK_PHONE = "+52 311 123 4567";

export default function OtpCodePage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const canResend = secondsLeft === 0;

  useEffect(() => {
    if (canResend) return;

    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [canResend]);

  function handleClose() {
    setOpen(false);
    router.back();
  }

  function handleCodeChange(value: string) {
    setCode(value);
    if (error) setError(undefined);
  }

  function handleVerify() {
    if (code.length < CODE_LENGTH) {
      setError("Ingresa los 6 dígitos");
      return;
    }

    if (code === MOCK_CODE) {
      router.push("/dr-guzman/agendar/confirmar");
      return;
    }

    setError("Código incorrecto. Inténtalo de nuevo.");
  }

  function handleResend() {
    console.log("Reenviando OTP a:", MOCK_PHONE);
    setSecondsLeft(RESEND_SECONDS);
    setError(undefined);
  }

  return (
    <>
      <AgendarPage />

      <BottomSheet
        open={open}
        onClose={handleClose}
        title="Ingresa el código de verificación"
        description={`Enviamos 6 dígitos por WhatsApp al ${MOCK_PHONE}.`}
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