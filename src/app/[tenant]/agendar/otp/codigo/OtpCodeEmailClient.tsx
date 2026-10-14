"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { OTPInput } from "@/components/ui/OTPInput";
import { isValidIsoDate, isValidTime } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/lib/tenant";
import { HorarioClient } from "../../horario/HorarioClient";

const CODE_LENGTH = 8;
const RESEND_SECONDS = 24;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

type OtpCodeEmailClientProps = {
  tenant: Tenant;
};

export function OtpCodeEmailClient({ tenant }: OtpCodeEmailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");
  const emailParam = searchParams.get("email");
  const nameParam = searchParams.get("name");

  const date = dateParam && isValidIsoDate(dateParam) ? dateParam : null;
  const time = timeParam && isValidTime(timeParam) ? timeParam : null;
  const email = emailParam && EMAIL_REGEX.test(emailParam) ? emailParam : null;
  const name = nameParam && nameParam.trim().length >= 2 ? nameParam.trim() : null;

  const [open, setOpen] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!date || !time) {
      router.replace(`/${tenant.slug}/agendar`);
      return;
    }
    if (!email || !name) {
      const params = new URLSearchParams({ date, time });
      router.replace(`/${tenant.slug}/agendar/otp?${params.toString()}`);
    }
  }, [date, time, email, name, router, tenant.slug]);

  useEffect(() => {
    if (secondsLeft === 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const handleClose = useCallback(() => {
    setOpen(false);
    router.back();
  }, [router]);

  function handleCodeChange(value: string) {
    setCode(value);
    if (error) setError(undefined);
  }

  async function handleVerify() {
    if (!date || !time || !email || !name || verifying) return;

    if (code.length < CODE_LENGTH) {
      setError("Ingresa los 8 dígitos");
      return;
    }

    setVerifying(true);
    setError(undefined);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (verifyError || !data.user) {
      setError("Código incorrecto. Inténtalo de nuevo.");
      setVerifying(false);
      return;
    }

    const startsAt = new Date(`${date}T${time}:00`);

    const { error: updateError, count } = await supabase
      .from("appointments")
      .update(
        {
          patient_id: data.user.id,
          patient_name: name,
          status: "confirmed",
          hold_expires_at: null,
        },
        { count: "exact" },
      )
      .eq("tenant_id", tenant.id)
      .eq("starts_at", startsAt.toISOString())
      .eq("patient_email", email)
      .eq("status", "pending");

    if (updateError) {
      setError("No pudimos confirmar tu cita. Inténtalo de nuevo.");
      setVerifying(false);
      return;
    }

    if (!count) {
      setError(
        "Tu reserva expiró o el horario ya no está disponible. Elige otro horario.",
      );
      setVerifying(false);
      return;
    }

    setVerifying(false);
    const params = new URLSearchParams({ date, time });
    router.push(`/${tenant.slug}/agendar/confirmar?${params.toString()}`);
  }

  async function handleResend() {
    if (!email || secondsLeft > 0 || resending) return;

    setResending(true);
    setError(undefined);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    setResending(false);

    if (otpError) {
      setError("No pudimos reenviar el código. Inténtalo de nuevo.");
      return;
    }

    setCode("");
    setSecondsLeft(RESEND_SECONDS);
  }

  if (!date || !time || !email || !name) return null;

  return (
    <>
      <Suspense fallback={null}>
        <HorarioClient tenant={tenant} />
      </Suspense>

      <BottomSheet
        open={open}
        onClose={handleClose}
        title="Ingresa el código de verificación"
        description={`Enviamos 8 dígitos a ${email}.`}
      >
        <div className="flex flex-col gap-ds-6">
          <OTPInput
            length={CODE_LENGTH}
            value={code}
            onChange={handleCodeChange}
            error={error}
          />

          <div className="flex flex-col gap-ds-4">
            <Button
              variant={verifying ? "disabled" : "primary"}
              onClick={handleVerify}
              className="w-full"
            >
              {verifying ? "Verificando…" : "Verificar"}
            </Button>

            <div
              role="status"
              aria-live="polite"
              className="flex min-h-[44px] items-center justify-center text-14"
            >
              {secondsLeft === 0 ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="min-h-[44px] text-primary underline"
                >
                  {resending ? "Reenviando…" : "Reenviar código"}
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