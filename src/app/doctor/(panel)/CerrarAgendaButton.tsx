"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

type CerrarAgendaButtonProps = {
  tenantId: string;
  closed: boolean;
};

export function CerrarAgendaButton({ tenantId, closed }: CerrarAgendaButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  async function handleToggle() {
    if (saving) return;

    if (
      !closed &&
      !window.confirm(
        "¿Cerrar la agenda? Los pacientes no podrán reservar hasta que la vuelvas a abrir.",
      )
    ) {
      return;
    }

    setSaving(true);
    setError(undefined);

    const { error: updateError, count } = await supabase
      .from("tenants")
      .update(
        { current_status: closed ? "abierto" : "agenda-cerrada" },
        { count: "exact" },
      )
      .eq("id", tenantId);

    if (updateError || !count) {
      setError("No pudimos actualizar la agenda. Inténtalo de nuevo.");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.refresh();
  }

  return (
    <div className="fixed bottom-ds-7 right-ds-7 z-30 flex w-[208px] flex-col gap-ds-3">
      {error ? <Alert variant="danger" title={error} /> : null}
      <Button
        variant={saving ? "disabled" : "primary"}
        icon={
          closed ? (
            <LockKeyholeOpen size={20} aria-hidden="true" />
          ) : (
            <LockKeyhole size={20} aria-hidden="true" />
          )
        }
        onClick={handleToggle}
        className="w-full"
      >
        {saving ? "Guardando…" : closed ? "Abrir agenda" : "Cerrar agenda"}
      </Button>
    </div>
  );
}
