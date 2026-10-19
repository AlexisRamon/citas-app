"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import { PatientAuthCard } from "@/components/auth/PatientAuthCard";
import { Alert } from "@/components/ui/Alert";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SLOT_MINUTES, getSlotStart } from "@/lib/booking";
import {
  formatLongDate,
  formatTimeLabel,
  isValidIsoDate,
  isValidTime,
} from "@/lib/format-date";
import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/lib/tenant";

const SLOT_TAKEN_CODES = ["23P01", "23505"];

type AuthState =
  | { kind: "loading" }
  | { kind: "anon" }
  | { kind: "user"; id: string; email: string };

type ResumenClientProps = {
  tenant: Tenant;
};

export function ResumenClient({ tenant }: ResumenClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");
  const date = dateParam && isValidIsoDate(dateParam) ? dateParam : null;
  const time = timeParam && isValidTime(timeParam) ? timeParam : null;

  const [auth, setAuth] = useState<AuthState>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [slotTaken, setSlotTaken] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!date || !time) router.replace(`/${tenant.slug}/agendar`);
  }, [date, time, router, tenant.slug]);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (!user || !user.email) {
          setAuth({ kind: "anon" });
          return;
        }

        const fullName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : "";

        setName((current) => current || fullName);
        setAuth({ kind: "user", id: user.id, email: user.email });
      } catch {
        if (!cancelled) setAuth({ kind: "anon" });
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function handleAuthenticated() {
    setAuth({ kind: "loading" });
    setReloadKey((current) => current + 1);
  }

  async function handleSignOut() {
    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError("No pudimos cerrar la sesión. Inténtalo de nuevo.");
      return;
    }

    setAuth({ kind: "anon" });
  }

  async function handleConfirm() {
    if (!date || !time || auth.kind !== "user" || saving) return;

    const patientName = name.trim();
    if (patientName.length < 2) {
      setNameError("Ingresa tu nombre");
      return;
    }

    setSaving(true);
    setError(undefined);
    setNameError(undefined);

    const supabase = createClient();
    const startsAt = getSlotStart(date, time);
    const endsAt = new Date(startsAt.getTime() + SLOT_MINUTES * 60 * 1000);

    const { error: insertError } = await supabase.from("appointments").insert({
      tenant_id: tenant.id,
      patient_id: auth.id,
      patient_name: patientName,
      patient_email: auth.email,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "confirmed",
    });

    if (insertError) {
      const message = insertError.message ?? "";

      if (message.includes("agenda_closed")) {
        setError("El consultorio cerró su agenda por ahora. Intenta más tarde.");
      } else if (message.includes("invalid_start")) {
        setError("Ese horario ya pasó. Elige otro.");
        setSlotTaken(true);
      } else if (SLOT_TAKEN_CODES.includes(insertError.code ?? "")) {
        setError("Ese horario ya no está disponible. Elige otro.");
        setSlotTaken(true);
      } else {
        setError("No pudimos confirmar tu cita. Inténtalo de nuevo.");
      }

      setSaving(false);
      return;
    }

    setSaving(false);
    const params = new URLSearchParams({ date, time });
    router.push(`/${tenant.slug}/agendar/confirmar?${params.toString()}`);
  }

  if (!date || !time) return null;

  const address = tenant.address || (tenant.addressLines ?? []).join(", ");
  const details = [
    { label: "Doctor", value: tenant.name },
    {
      label: "Fecha y hora",
      value: `${formatLongDate(date)} · ${formatTimeLabel(time)}`,
    },
    { label: "Dirección", value: address },
  ].filter((detail) => detail.value);

  return (
    <>
      <main className="flex min-h-dvh flex-col gap-ds-6 bg-background px-ds-6 pb-[calc(64px+var(--spacing-ds-6)+env(safe-area-inset-bottom))] pt-ds-3">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver a elegir horario"
            className="flex size-[44px] items-center justify-center rounded-sm bg-surface text-text"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <p className="text-14 font-bold text-text">{tenant.name}</p>
          <div
            aria-hidden="true"
            className="flex size-[40px] items-center justify-center rounded-md bg-surface-soft"
          >
            <span className="text-16 font-bold text-primary">
              {tenant.initials}
            </span>
          </div>
        </header>

        <section className="flex flex-col gap-ds-2">
          <h1 className="text-24 font-bold text-text">Confirma tu cita</h1>
          <p className="text-14 text-text-muted">
            Revisa los datos antes de agendar.
          </p>
        </section>

        <section
          aria-label="Detalles de la cita"
          className="rounded-md border border-border bg-surface p-ds-5"
        >
          <dl className="flex flex-col gap-ds-4">
            {details.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-14 text-text-muted">{label}</dt>
                <dd className="text-16 font-bold text-text">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {auth.kind === "loading" ? (
          <div
            role="status"
            aria-label="Comprobando tu sesión"
            className="h-[160px] w-full rounded-md bg-surface-soft"
          />
        ) : auth.kind === "anon" ? (
          <PatientAuthCard
            onAuthenticated={handleAuthenticated}
            title="Inicia sesión para agendar"
            description="Necesitas una cuenta con el correo verificado para reservar."
          />
        ) : (
          <div className="flex flex-col gap-ds-4">
            <div className="flex flex-wrap items-center gap-x-ds-3 text-14 text-text-muted">
              <p>Sesión: {auth.email}</p>
              <button
                type="button"
                onClick={handleSignOut}
                className="min-h-[44px] font-bold text-primary underline"
              >
                Cerrar sesión
              </button>
            </div>

            <Input
              type="text"
              autoComplete="name"
              label="Nombre del paciente"
              placeholder="Tu nombre y apellido"
              value={name}
              onChange={(value) => {
                setName(value);
                if (nameError) setNameError(undefined);
              }}
              error={nameError}
            />

            {error ? <Alert variant="danger" title={error} /> : null}

            {slotTaken ? (
              <Button
                href={`/${tenant.slug}/agendar/horario?date=${date}`}
                variant="secondary"
                className="w-full"
              >
                Elegir otro horario
              </Button>
            ) : (
              <Button
                variant={saving ? "disabled" : "primary"}
                icon={<CalendarCheck size={20} aria-hidden="true" />}
                onClick={handleConfirm}
                className="w-full"
              >
                {saving ? "Agendando…" : "Confirmar cita"}
              </Button>
            )}
          </div>
        )}

        {auth.kind !== "user" ? (
          <Link
            href={`/${tenant.slug}/agendar/horario?date=${date}`}
            className="flex min-h-[44px] items-center justify-center text-14 text-primary underline"
          >
            Cambiar horario
          </Link>
        ) : null}
      </main>

      <BottomNav slug={tenant.slug} activeHref={`/${tenant.slug}/home`} />
    </>
  );
}
