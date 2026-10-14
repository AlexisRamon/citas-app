"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  formatLongDate,
  formatTimeLabel,
  isValidIsoDate,
  isValidTime,
} from "@/lib/format-date";
import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/lib/tenant";
import { HorarioClient } from "../horario/HorarioClient";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const SLOT_MINUTES = 30;
const HOLD_MINUTES = 10;

type OtpEmailClientProps = {
  tenant: Tenant;
};

export function OtpEmailClient({ tenant }: OtpEmailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");
  const date = dateParam && isValidIsoDate(dateParam) ? dateParam : null;
  const time = timeParam && isValidTime(timeParam) ? timeParam : null;

  const [open, setOpen] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!date || !time) router.replace(`/${tenant.slug}/agendar`);
  }, [date, time, router, tenant.slug]);

  const handleClose = useCallback(() => {
    setOpen(false);
    router.back();
  }, [router]);

  function handleNameChange(value: string) {
    setName(value);
    if (nameError) setNameError(undefined);
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    if (error) setError(undefined);
  }

  async function handleSend() {
    if (!date || !time || sending) return;

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const nameInvalid = normalizedName.length < 2;
    const emailInvalid =
      !normalizedEmail || !EMAIL_REGEX.test(normalizedEmail);

    setNameError(nameInvalid ? "Ingresa tu nombre" : undefined);
    setError(emailInvalid ? "Ingresa un correo válido" : undefined);

    if (nameInvalid || emailInvalid) return;

    setSending(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });

    if (otpError) {
      setError("No pudimos enviar el código. Inténtalo de nuevo.");
      setSending(false);
      return;
    }

    const startsAt = new Date(`${date}T${time}:00`);
    const endsAt = new Date(startsAt.getTime() + SLOT_MINUTES * 60 * 1000);

    const { error: holdError } = await supabase.from("appointments").insert({
      tenant_id: tenant.id,
      patient_name: normalizedName,
      patient_email: normalizedEmail,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "pending",
      hold_expires_at: new Date(
        Date.now() + HOLD_MINUTES * 60 * 1000,
      ).toISOString(),
    });

    if (holdError) {
      setError(
        "No pudimos reservar el horario. Elige otro e inténtalo de nuevo.",
      );
      setSending(false);
      return;
    }

    setSending(false);
    const params = new URLSearchParams({
      date,
      time,
      email: normalizedEmail,
      name: normalizedName,
    });
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
        title="Verifica tu correo para confirmar"
        description={`${formatLongDate(date)} · ${formatTimeLabel(time)}`}
      >
        <div className="flex flex-col gap-ds-5">
          <div className="flex flex-col gap-ds-4">
            <Input
              type="text"
              autoComplete="name"
              label="Nombre completo"
              placeholder="Tu nombre y apellido"
              value={name}
              onChange={handleNameChange}
              error={nameError}
              required
            />
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              label="Correo electrónico"
              placeholder="tu@correo.com"
              value={email}
              onChange={handleEmailChange}
              error={error}
              hint="Te enviaremos un código de verificación."
              required
            />
          </div>

          <Button
            variant={sending ? "disabled" : "primary"}
            onClick={handleSend}
            icon={<Mail size={20} aria-hidden="true" />}
            className="w-full"
          >
            {sending ? "Enviando…" : "Enviar código por correo"}
          </Button>

          <p className="text-center text-14 text-text-muted">
            Al continuar, aceptas el aviso de privacidad. Usaremos tu correo solo
            para verificar tu cita y enviarte recordatorios.
          </p>
        </div>
      </BottomSheet>
    </>
  );
}