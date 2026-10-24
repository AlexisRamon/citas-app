import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Correo de avisos del consultorio. Solo se obtiene para una cita del propio
 * paciente (función SQL get_notification_email); nunca es legible en general.
 */
export async function getClinicEmail(
  supabase: ServerClient,
  appointmentId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_notification_email", {
    p_appointment: appointmentId,
  });

  if (error || typeof data !== "string" || !data) return null;
  return data;
}
