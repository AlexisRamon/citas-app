import { notFound, redirect } from "next/navigation";
import { getAvailabilityRules } from "@/lib/availability-data";
import { getTenantBySlug } from "@/lib/tenant";
import { AgendarClient } from "./AgendarClient";

type PageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function AgendarPage({ params }: PageProps) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (tenant.currentStatus === "agenda-cerrada") {
    redirect(`/${tenant.slug}/home`);
  }

  const rules = await getAvailabilityRules(tenant.id);

  return <AgendarClient tenant={tenant} rules={rules} />;
}