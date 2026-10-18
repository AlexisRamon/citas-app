import Link from "next/link";
import { CalendarCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-ds-6 bg-background px-ds-6 py-ds-8 text-center">
      <div
        aria-hidden="true"
        className="flex size-[72px] items-center justify-center rounded-lg bg-surface-soft text-primary"
      >
        <CalendarCheck size={32} />
      </div>
      <div className="flex max-w-[400px] flex-col gap-ds-2">
        <h1 className="text-24 font-bold text-text">Agenda tu cita</h1>
        <p className="text-16 text-text-muted">
          Escanea el código QR de tu consultorio o abre el enlace que te
          compartieron para reservar tu consulta.
        </p>
      </div>
      <Link
        href="/doctor/login"
        className="flex min-h-[44px] items-center text-14 font-bold text-primary underline"
      >
        Soy doctor
      </Link>
    </main>
  );
}
