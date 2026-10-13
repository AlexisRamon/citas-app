import Image from "next/image";
import {
  CalendarPlus,
  CircleCheck,
  Clock3,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Ticket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";

type HomeVariant = "abierto" | "proximo" | "cerrado";

// Para probar los estados, cambia esta línea:
const variant: HomeVariant = "abierto";

const TENANT = {
  slug: "dr-guzman",
  name: "Dr. Guzmán",
  initials: "DG",
  specialty: "Medicina general",
  city: "Ciudad de México",
  photo: "/tenants/dr-guzman/consultorio.svg",
  officeName: "Consultorio Alameda",
  addressLines: ["Av. Álvaro Obregón 128, Roma Norte", "Ciudad de México"],
};

const STATUS: Record<
  HomeVariant,
  {
    icon: LucideIcon;
    title: string;
    lines: string[];
    signalClasses: string;
    titleClasses: string;
  }
> = {
  abierto: {
    icon: CircleCheck,
    title: "Abierto ahora",
    lines: ["Lunes 12 de octubre", "Atención de 9:00 a. m. a 5:00 p. m."],
    signalClasses: "bg-surface-soft text-success",
    titleClasses: "text-success",
  },
  proximo: {
    icon: Clock3,
    title: "Próximo hueco 4PM",
    lines: ["Lunes 12 de octubre · 4:00 p. m.", "Consulta presencial de 30 minutos."],
    signalClasses: "bg-warning-soft text-warning",
    titleClasses: "text-warning",
  },
  cerrado: {
    icon: LockKeyhole,
    title: "Cerrado hoy",
    lines: ["Domingo 11 de octubre. Hoy no hay atención; puedes reservar para otro día."],
    signalClasses: "bg-disabled text-text-muted",
    titleClasses: "text-text-muted",
  },
};

export default function TenantHomePage() {
  const status = STATUS[variant];
  const StatusIcon = status.icon;

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
          <Badge variant="invitado" />
        </header>

        <section className="flex flex-col gap-ds-2">
          <p className="text-14 font-bold uppercase text-primary">
            Tu consultorio, cerca de ti
          </p>
          <h1 className="text-32 font-bold text-text">{TENANT.name}</h1>
          <p className="text-16 text-text-muted">
            {TENANT.specialty} · {TENANT.city}
          </p>
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="relative h-[172px] w-full">
            <Image
              src={TENANT.photo}
              alt={`Consultorio de ${TENANT.name}`}
              fill
              sizes="(max-width: 480px) 100vw, 480px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-ds-3 p-ds-5">
            <div className="flex items-center gap-ds-3">
              <div
                aria-hidden="true"
                className={`flex size-[32px] shrink-0 items-center justify-center rounded-sm ${status.signalClasses}`}
              >
                <StatusIcon size={18} />
              </div>
              <p className={`text-20 font-bold ${status.titleClasses}`}>
                {status.title}
              </p>
            </div>
            <div className="text-14 text-text-muted">
              {status.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-ds-3">
          <Button
            href="/dr-guzman/agendar"
            variant="primary"
            icon={<CalendarPlus size={20} />}
            className="w-full"
          >
            Agendar cita
          </Button>

          <Button
            href="/dr-guzman/mi-cita"
            variant="secondary"
            icon={<Ticket size={20} />}
            className="w-full"
          >
            Ver mi cita
          </Button>
          <p className="text-center text-14 text-text-muted">
            Reserva sin registrarte.
          </p>
        </section>

        <section className="flex flex-col gap-ds-3">
          <div className="flex items-start gap-ds-3">
            <MapPin size={20} aria-hidden="true" className="shrink-0 text-primary" />
            <div className="flex flex-1 flex-col gap-ds-1">
              <p className="text-16 font-bold text-text">{TENANT.officeName}</p>
              <address className="text-14 not-italic text-text-muted">
                {TENANT.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </address>
            </div>
          </div>

          <div className="h-px w-full bg-border" aria-hidden="true" />

          <div className="flex flex-col gap-ds-2 pt-ds-2">
            <button
              type="button"
              className="flex min-h-[44px] w-full items-center justify-center gap-ds-2 text-14 font-bold text-primary"
            >
              <MessageCircle size={16} aria-hidden="true" />
              ¿Necesitas ayuda? Contacta al consultorio
            </button>
            <p className="text-center text-14 text-text-muted">
              Tus datos se tratan con privacidad.
            </p>
          </div>
        </section>
      </main>

      <BottomNav activeHref="/dr-guzman/home" />
    </>
  );
}