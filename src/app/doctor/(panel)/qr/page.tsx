import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QRClient } from "./QRClient";
import type { QRTenant } from "./QRClient";

export default async function QRPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/doctor/login");

  const { data: profile } = await supabase
    .from("doctor_profiles")
    .select("tenants(slug, name, initials, specialty)")
    .eq("user_id", user.id)
    .maybeSingle<{ tenants: QRTenant | null }>();

  if (!profile || !profile.tenants) {
    redirect("/doctor/login?error=sin-acceso");
  }

  return <QRClient tenant={profile.tenants} />;
}