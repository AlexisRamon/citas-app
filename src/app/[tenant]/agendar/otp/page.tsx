"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import AgendarPage from "../page";

type Channel = "whatsapp" | "sms";

export default function OtpPhonePage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  function handleClose() {
    setOpen(false);
    router.back();
  }

  function handlePhoneChange(value: string) {
    setPhone(value);
    if (error) setError(undefined);
  }

  function handleSend(channel: Channel) {
    if (phone.length < 10) {
      setError("Ingresa un número válido");
      return;
    }

    console.log("Enviando OTP a:", phone, `(${channel})`);
    router.push("/dr-guzman/agendar/otp/codigo");
  }

  return (
    <>
      <AgendarPage />

      <BottomSheet
        open={open}
        onClose={handleClose}
        title="Verifica tu número para confirmar"
        description="Así evitamos citas falsas y te enviamos recordatorios"
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