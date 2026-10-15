import { Suspense } from "react";
import type { CSSProperties, ReactNode } from "react";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/ui/SidebarNav";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type DoctorTenant = {
  slug: string;
  name: string;
  initials: string;
  specialty: string | null;
  primary_color: string | null;
  primary_color_hover: string | null;
};

type DoctorProfileRow = {
  user_id: string;
  tenant_id: string;
  role: string;
  tenants: DoctorTenant | null;
};

type DoctorLayoutProps = {
  children: ReactNode;
};

async function DoctorShell({ children }: DoctorLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/doctor/login");

  const { data: profile } = await supabase
    .from("doctor_profiles")
    .select(
      "user_id, tenant_id, role, tenants(slug, name, initials, specialty, primary_color, primary_color_hover)",
    )
    .eq("user_id", user.id)
    .maybeSingle<DoctorProfileRow>();

  if (!profile || !profile.tenants) {
    redirect("/doctor/login?error=sin-acceso");
  }

  const tenant = profile.tenants;

  const style: Record<string, string> = {};
  if (tenant.primary_color) {
    style["--color-primary"] = tenant.primary_color;
  }
  if (tenant.primary_color_hover) {
    style["--color-primary-hover"] = tenant.primary_color_hover;
  }

  return (
    <div
      style={style as CSSProperties}
      className="flex min-h-dvh flex-col bg-background lg:flex-row"
    >
      <SidebarNav
        slug={tenant.slug}
        doctorName={tenant.name}
        initials={tenant.initials}
        specialty={tenant.specialty ?? undefined}
      />
      <main className="min-w-0 flex-1 p-ds-6 lg:p-ds-8">{children}</main>
    </div>
  );
}

export default function DoctorLayout({ children }: DoctorLayoutProps) {
  return (
    <Suspense fallback={null}>
      <DoctorShell>{children}</DoctorShell>
    </Suspense>
  );
}