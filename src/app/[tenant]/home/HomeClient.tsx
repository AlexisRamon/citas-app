"use client";

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
import type { Tenant, TenantStatus } from "@/lib/tenant";

const FALLBACK_PHOTO = "/tenants/default/consultorio.svg";

const STATUS: Record<
  TenantStatus,
  {
    icon: LucideIcon;
    title: string;
    lines: string[];
    signalClasses: string;
    titleClasses: string;
    canBook: boolean;
  }
> = {
  abierto: {
    icon: CircleCheck,
    title: "Abierto ahora",
    lines: ["Atención de 9:00 a. m. a 5:00 p. m."],
    signalClasses: "bg-surface-soft text-success",
    titleClasses: "text-success",
    canBook: true,
  },
  proximo: {
    icon: Clock3,
    title: "Próximo hueco a las 4:00 p. m.",
    lines: ["Consulta presencial de 30 minutos."],
    signalClasses: "bg-warning-soft text-warning",
    titleClasses: "text-warning",
    canBook: true,
  },
  cerrado: {
    icon: LockKeyhole,
    title: "Cerrado hoy",
    lines: ["Hoy no hay atención.", "Puedes reservar para otro día."],
    signalClasses: "bg-disabled text-text-muted",
    titleClasses: "text-text-muted",
    canBook: true,
  },
  "agenda-cerrada": {
    icon: LockKeyhole,
    title: "Sin citas por ahora",
    lines: ["Vuelve pronto o contacta al consultorio."],
    signalClasses: "bg-disabled text-text-muted",
    titleClasses: "text-text-muted",
    canBook: false,
  },
};

type HomeClientProps = {
  tenant: Tenant;
};

export function HomeClient({ tenant }: HomeClientProps) {
  const variant: TenantStatus = tenant.currentStatus;
  const status = STATUS[variant];
  const StatusIcon = status.icon;

  const subtitle = [tenant.specialty, tenant.city].filter(Boolean).join(" · ");
  const addressLines = tenant.addressLines?.length
    ? tenant.addressLines
    : tenant.address
      ? [tenant.address]
      : [];

  return (
    <>
      <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pb-[calc(64px+var(--spacing-ds-6)+env(safe-area-inset-bottom))] pt-ds-3">
        <header className="flex items-center justify-between">
          <div
            aria-hidden="true"
            className="flex size-[48px] items-center justify-center rounded-md bg-surface-soft"
          >
            <span className="text-20 font-bold text-primary">
              {tenant.initials}
            </span>
          </div>
          <Badge variant="invitado" />
        </header>

        <section className="flex flex-col gap-ds-2">
          <p className="text-14 font-bold uppercase text-primary">
            Tu consultorio, cerca de ti
          </p>
          <h1 className="text-32 font-bold text-text">{tenant.name}</h1>
          {subtitle ? (
            <p className="text-16 text-text-muted">{subtitle}</p>
          ) : null}
        </section>

        {status.canBook ? null : (
          <div
            role="status"
            className="flex items-center gap-ds-3 rounded-md bg-disabled p-ds-4 text-text-muted"
          >
            <LockKeyhole size={20} aria-hidden="true" className="shrink-0" />
            <p className="text-16 font-bold">Agenda cerrada por el doctor</p>
          </div>
        )}

        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="relative h-[172px] w-full">
            <Image
              src={tenant.photoUrl ?? FALLBACK_PHOTO}
              alt={`Consultorio de ${tenant.name}`}
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
          {status.canBook ? (
            <Button
              href={`/${tenant.slug}/agendar`}
              variant="primary"
              icon={<CalendarPlus size={20} aria-hidden="true" />}
              className="w-full"
            >
              Agendar cita
            </Button>
          ) : (
            <Button
              variant="disabled"
              icon={<CalendarPlus size={20} aria-hidden="true" />}
              className="w-full"
            >
              Agendar cita
            </Button>
          )}

          <Button
            href={`/${tenant.slug}/mi-cita`}
            variant="secondary"
            icon={<Ticket size={20} aria-hidden="true" />}
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
            <MapPin
              size={20}
              aria-hidden="true"
              className="shrink-0 text-primary"
            />
            <div className="flex flex-1 flex-col gap-ds-1">
              {tenant.officeName ? (
                <p className="text-16 font-bold text-text">
                  {tenant.officeName}
                </p>
              ) : null}
              <address className="text-14 not-italic text-text-muted">
                {addressLines.map((line) => (
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

      <BottomNav slug={tenant.slug} activeHref={`/${tenant.slug}/home`} />
    </>
  );
}