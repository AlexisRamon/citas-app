import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type TenantStatus = "abierto" | "proximo" | "cerrado" | "agenda-cerrada";

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  initials: string;
  specialty: string;
  officeName: string;
  city: string;
  address: string;
  addressLines: string[] | null;
  phone: string;
  photoUrl: string | null;
  primaryColor: string | null;
  primaryHoverColor: string | null;
  currentStatus: TenantStatus;
};

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  initials: string;
  specialty: string | null;
  office_name: string | null;
  address: string | null;
  address_lines: string[] | null;
  city: string | null;
  phone: string | null;
  photo_url: string | null;
  primary_color: string | null;
  primary_color_hover: string | null;
  current_status: TenantStatus | null;
};

export const getTenantBySlug = cache(
  async (slug: string): Promise<Tenant | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .maybeSingle<TenantRow>();

    if (error || !data) return null;

    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      initials: data.initials,
      specialty: data.specialty ?? "",
      officeName: data.office_name ?? "",
      city: data.city ?? "",
      address: data.address ?? "",
      addressLines: data.address_lines,
      phone: data.phone ?? "",
      photoUrl: data.photo_url,
      primaryColor: data.primary_color,
      primaryHoverColor: data.primary_color_hover,
      currentStatus: data.current_status ?? "abierto",
    };
  },
);