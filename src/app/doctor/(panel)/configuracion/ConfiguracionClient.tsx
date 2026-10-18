"use client";

import { useEffect, useId, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  Check,
  CircleCheck,
  MapPin,
  MessageCircle,
  Save,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { COLOR_PALETTE, findPaletteColor } from "@/lib/color-palette";
import { createClient } from "@/lib/supabase/client";

const FALLBACK_PHOTO = "/tenants/default/consultorio.svg";

export type ConfiguracionTenant = {
  id: string;
  slug: string;
  name: string;
  initials: string;
  specialty: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  photoUrl: string | null;
  primaryColor: string | null;
  primaryHoverColor: string | null;
};

type FormValues = {
  photoUrl: string;
  name: string;
  specialty: string;
  address: string;
  city: string;
  phone: string;
  color: string | null;
};

type FormErrors = Partial<Record<"name" | "photoUrl", string>>;

type ConfiguracionClientProps = {
  tenant: ConfiguracionTenant;
};

function isValidHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function ConfiguracionClient({ tenant }: ConfiguracionClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const colorLabelId = useId();
  const previewTitleId = useId();

  const initialValues: FormValues = {
    photoUrl: tenant.photoUrl ?? "",
    name: tenant.name,
    specialty: tenant.specialty ?? "",
    address: tenant.address ?? "",
    city: tenant.city ?? "",
    phone: tenant.phone ?? "",
    color: findPaletteColor(tenant.primaryColor)?.primary ?? null,
  };

  const [baseline, setBaseline] = useState<FormValues>(initialValues);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);

  const isDirty = (Object.keys(values) as (keyof FormValues)[]).some(
    (key) => values[key] !== baseline[key],
  );

  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setSaveError(undefined);
    if (key === "name" || key === "photoUrl") {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function validate(): FormErrors {
    const next: FormErrors = {};

    if (values.name.trim().length < 2) {
      next.name = "Ingresa el nombre del consultorio";
    }

    const photo = values.photoUrl.trim();
    if (photo && !isValidHttpsUrl(photo)) {
      next.photoUrl = "Ingresa una URL válida que empiece con https://";
    }

    return next;
  }

  async function handleSave() {
    if (saving) return;

    setSaved(false);
    setSaveError(undefined);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);

    const normalized: FormValues = {
      ...values,
      photoUrl: values.photoUrl.trim(),
      name: values.name.trim(),
      specialty: values.specialty.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      phone: values.phone.trim(),
    };

    const palette = findPaletteColor(normalized.color);

    const payload: Record<string, string | string[] | null> = {
      photo_url: normalized.photoUrl || null,
      name: normalized.name,
      specialty: normalized.specialty || null,
      address: normalized.address || null,
      address_lines: normalized.address
        ? normalized.address
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean)
        : null,
      city: normalized.city || null,
      phone: normalized.phone || null,
    };

    if (palette) {
      payload.primary_color = palette.primary;
      payload.primary_color_hover = palette.hover;
    }

    const { error, count } = await supabase
      .from("tenants")
      .update(payload, { count: "exact" })
      .eq("id", tenant.id);

    if (error) {
      setSaveError("No pudimos guardar los cambios. Inténtalo de nuevo.");
      setSaving(false);
      return;
    }

    if (!count) {
      setSaveError(
        "No pudimos guardar los cambios: tu cuenta no tiene permiso para editar este consultorio.",
      );
      setSaving(false);
      return;
    }

    setValues(normalized);
    setBaseline(normalized);
    setSaved(true);
    setSaving(false);
    router.refresh();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSave();
  }

  const selectedPalette = findPaletteColor(values.color);

  const previewStyle: Record<string, string> = {};
  const previewPrimary = selectedPalette?.primary ?? tenant.primaryColor;
  const previewHover = selectedPalette?.hover ?? tenant.primaryHoverColor;
  if (previewPrimary) previewStyle["--color-primary"] = previewPrimary;
  if (previewHover) previewStyle["--color-primary-hover"] = previewHover;

  const previewName = values.name.trim() || "Tu consultorio";
  const previewSubtitle = [values.specialty.trim(), values.city.trim()]
    .filter(Boolean)
    .join(" · ");
  const previewPhoto =
    values.photoUrl.trim() &&
    isValidHttpsUrl(values.photoUrl.trim()) &&
    failedPhoto !== values.photoUrl.trim()
      ? values.photoUrl.trim()
      : FALLBACK_PHOTO;

  return (
    <div className="flex flex-col gap-ds-6">
      <div className="sticky top-0 z-20 bg-background py-ds-3">
        <PageHeader
          title="Configuración White-Label"
          subtitle="Personaliza la identidad de tu consultorio."
          actions={
            <Button
              variant={saving ? "disabled" : "primary"}
              icon={<Save size={20} aria-hidden="true" />}
              onClick={handleSave}
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          }
        />
      </div>

      {saved ? (
        <Alert
          variant="info"
          icon={CircleCheck}
          title="Cambios guardados"
          description="Tus pacientes ya verán la nueva identidad."
        />
      ) : null}
      {saveError ? <Alert variant="danger" title={saveError} /> : null}

      <div className="grid grid-cols-1 gap-ds-6 lg:grid-cols-[3fr_2fr]">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-ds-4"
        >
          <Input
            type="url"
            inputMode="url"
            autoComplete="off"
            label="Imagen del consultorio (URL)"
            placeholder="https://..."
            hint="Aparece en la parte superior de la página de tus pacientes."
            value={values.photoUrl}
            onChange={(value) => setField("photoUrl", value)}
            error={errors.photoUrl}
          />
          <Input
            label="Nombre del consultorio"
            autoComplete="organization"
            value={values.name}
            onChange={(value) => setField("name", value)}
            error={errors.name}
            required
          />
          <Input
            label="Especialidad"
            value={values.specialty}
            onChange={(value) => setField("specialty", value)}
          />

          <div className="flex flex-col gap-ds-2">
            <p id={colorLabelId} className="text-14 font-bold text-text">
              Color primario
            </p>
            <div
              role="radiogroup"
              aria-labelledby={colorLabelId}
              className="flex flex-wrap gap-ds-3"
            >
              {COLOR_PALETTE.map((color) => {
                const selected = values.color === color.primary;

                return (
                  <button
                    key={color.primary}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={color.name}
                    title={color.name}
                    onClick={() => setField("color", color.primary)}
                    style={{ backgroundColor: color.primary }}
                    className={`flex size-[48px] items-center justify-center rounded-full outline-offset-2 focus-visible:outline-2 focus-visible:outline-text ${
                      selected ? "outline-2 outline-text" : ""
                    }`}
                  >
                    {selected ? (
                      <Check
                        size={20}
                        aria-hidden="true"
                        className="text-surface"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="text-14 text-text-muted">
              {selectedPalette
                ? `Color seleccionado: ${selectedPalette.name}. `
                : "Elige un color de la paleta. "}
              Opciones visuales para la marca de tu consultorio.
            </p>
          </div>

          <Input
            label="Dirección"
            autoComplete="street-address"
            value={values.address}
            onChange={(value) => setField("address", value)}
          />
          <Input
            label="Ciudad"
            autoComplete="address-level2"
            value={values.city}
            onChange={(value) => setField("city", value)}
          />
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            label="Teléfono"
            value={values.phone}
            onChange={(value) => setField("phone", value)}
          />

          <Button
            type="submit"
            variant={saving ? "disabled" : "primary"}
            icon={<Save size={20} aria-hidden="true" />}
            className="w-full"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>

        <aside
          aria-labelledby={previewTitleId}
          className="flex flex-col items-center gap-ds-4 self-start rounded-lg border border-border bg-surface-soft p-ds-5"
        >
          <h2 id={previewTitleId} className="text-14 font-bold text-primary">
            Vista previa en vivo
          </h2>

          <div
            aria-hidden="true"
            style={previewStyle as CSSProperties}
            className="flex h-[624px] w-[280px] shrink-0 flex-col gap-ds-3 overflow-hidden rounded-lg border-[3px] border-text bg-background p-ds-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-[36px] items-center justify-center rounded-md bg-surface-soft">
                <span className="text-16 font-bold text-primary">
                  {tenant.initials}
                </span>
              </div>
              <Badge variant="invitado" />
            </div>

            <div className="flex flex-col gap-ds-1">
              <p className="text-14 font-bold uppercase text-primary">
                Tu consultorio, cerca de ti
              </p>
              <p className="break-words text-24 font-bold text-text">
                {previewName}
              </p>
              {previewSubtitle ? (
                <p className="text-14 text-text-muted">{previewSubtitle}</p>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-md border border-border bg-surface">
              <div className="relative h-[100px] w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewPhoto}
                  alt=""
                  onError={() => setFailedPhoto(values.photoUrl.trim())}
                  className="size-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-ds-1 p-ds-3">
                <div className="flex items-center gap-ds-2 text-success">
                  <CircleCheck size={16} />
                  <p className="text-16 font-bold">Abierto ahora</p>
                </div>
                <p className="text-14 text-text-muted">
                  Atención de 9:00 a. m. a 5:00 p. m.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-ds-2">
              <div className="flex h-[40px] items-center justify-center gap-ds-2 rounded-md bg-primary text-16 font-bold text-surface">
                <CalendarPlus size={20} />
                Agendar cita
              </div>
              <div className="flex h-[40px] items-center justify-center rounded-md border border-border bg-surface text-16 font-bold text-primary">
                Ver mi cita
              </div>
              <p className="text-center text-14 text-text-muted">
                Reserva sin registrarte.
              </p>
            </div>

            <div className="flex flex-col gap-ds-2 text-14">
              {values.address.trim() ? (
                <div className="flex items-start gap-ds-2 text-text">
                  <MapPin size={16} className="shrink-0 text-primary" />
                  <p className="min-w-0 break-words">{values.address.trim()}</p>
                </div>
              ) : null}
              {values.phone.trim() ? (
                <div className="flex items-start gap-ds-2 font-bold text-primary">
                  <MessageCircle size={16} className="shrink-0" />
                  <p className="min-w-0 break-words">{values.phone.trim()}</p>
                </div>
              ) : null}
            </div>

            <p className="text-center text-14 text-text-muted">
              Tus datos se tratan con privacidad.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}