import { CalendarPlus, CalendarX2 } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { MOCK_TENANT } from "@/lib/tenant-mock";

export default function MiCitaPage() {
  return (
    <>
      <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pb-[calc(64px+var(--spacing-ds-6)+env(safe-area-inset-bottom))] pt-ds-3">
        <header className="flex items-center gap-ds-3">
          <div
            aria-hidden="true"
            className="flex size-[40px] items-center justify-center rounded-md bg-surface-soft"
          >
            <span className="text-16 font-bold text-primary">
              {MOCK_TENANT.initials}
            </span>
          </div>
          <p className="text-14 font-bold text-text">{MOCK_TENANT.name}</p>
        </header>

        <h1 className="text-24 font-bold text-text">Mi cita</h1>

        <section
          aria-labelledby="mi-cita-vacio"
          className="flex flex-1 flex-col items-center justify-center gap-ds-3 text-center"
        >
          <div
            aria-hidden="true"
            className="flex size-[88px] items-center justify-center rounded-full bg-disabled text-text-muted"
          >
            <CalendarX2 size={48} />
          </div>
          <h2 id="mi-cita-vacio" className="text-20 font-bold text-text">
            No tienes citas próximas
          </h2>
          <p className="text-14 text-text-muted">
            Cuando agendes una, aparecerá aquí.
          </p>
        </section>

        <Button
          href={`/${MOCK_TENANT.slug}/agendar`}
          variant="primary"
          icon={<CalendarPlus size={20} aria-hidden="true" />}
          className="w-full"
        >
          Agendar cita
        </Button>
      </main>

      <BottomNav activeHref={`/${MOCK_TENANT.slug}/mi-cita`} />
    </>
  );
}