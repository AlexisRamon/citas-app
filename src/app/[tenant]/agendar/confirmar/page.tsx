import { BadgeCheck, CalendarPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";

const TENANT = {
  name: "Dr. Guzmán",
  initials: "DG",
  address: "Calle Hidalgo 120, Tepic",
  phone: "311 123 4567",
};

const APPOINTMENT = {
  date: "Viernes 9 de octubre",
  time: "4:00 PM",
};

const DETAILS = [
  { label: "Doctor", value: TENANT.name },
  { label: "Fecha y hora", value: `${APPOINTMENT.date}, ${APPOINTMENT.time}` },
  { label: "Dirección", value: TENANT.address },
  { label: "Teléfono", value: TENANT.phone },
];

export default function ConfirmarPage() {
  return (
    <>
      <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pb-[calc(64px+var(--spacing-ds-6)+env(safe-area-inset-bottom))] pt-ds-3">
        <header className="flex items-center justify-between">
          <div
            aria-hidden="true"
            className="flex size-[48px] items-center justify-center rounded-md bg-surface-soft"
          >
            <span className="text-20 font-bold text-primary">{TENANT.initials}</span>
          </div>
          <Badge variant="verificado" />
        </header>

        <section className="flex flex-col items-center gap-ds-3 pt-ds-4 text-center">
          <div
            aria-hidden="true"
            className="flex size-[88px] items-center justify-center rounded-full bg-surface-soft text-success"
          >
            <BadgeCheck size={48} />
          </div>
          <h1 className="text-24 font-bold text-text">¡Cita confirmada!</h1>
          <p className="text-14 text-text-muted">
            Tu cita está lista. Guarda los detalles para tu visita.
          </p>
        </section>

        <section
          aria-label="Detalles de la cita"
          className="rounded-md border border-border bg-surface p-ds-5"
        >
          <dl className="flex flex-col gap-ds-4">
            {DETAILS.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-16 text-text-muted">{label}</dt>
                <dd className="text-16 font-bold text-text">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="flex flex-col gap-ds-3">
          <Button
            variant="primary"
            icon={<CalendarPlus size={20} />}
            className="w-full"
          >
            Añadir a mi calendario
          </Button>
          <Button variant="secondary" className="w-full">
            Compartir por WhatsApp
          </Button>
        </section>
      </main>

      <BottomNav activeHref="/dr-guzman/home" />
    </>
  );
}