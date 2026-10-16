import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfiguracionClient } from "./ConfiguracionClient";

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  initials: string;
  specialty: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  photo_url: string | null;
  primary_color: string | null;
  primary_color_hover: string | null;
};

export default async function ConfiguracionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/doctor/login");

  const { data: profile } = await supabase
    .from("doctor_profiles")
    .select(
      "tenants(id, slug, name, initials, specialty, address, city, phone, photo_url, primary_color, primary_color_hover)",
    )
    .eq("user_id", user.id)
    .maybeSingle<{ tenants: TenantRow | null }>();

  if (!profile || !profile.tenants) {
    redirect("/doctor/login?error=sin-acceso");
  }

  const tenant = profile.tenants;

  return (
    <ConfiguracionClient
      tenant={{
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        initials: tenant.initials,
        specialty: tenant.specialty,
        address: tenant.address,
        city: tenant.city,
        phone: tenant.phone,
        photoUrl: tenant.photo_url,
        primaryColor: tenant.primary_color,
        primaryHoverColor: tenant.primary_color_hover,
      }}
    />
  );
}