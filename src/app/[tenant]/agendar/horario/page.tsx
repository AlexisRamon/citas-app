import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getAvailabilityRules } from "@/lib/availability-data";
import { getTenantBySlug } from "@/lib/tenant";
import { HorarioClient, HorarioSkeleton } from "./HorarioClient";

type PageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function HorarioPage({ params }: PageProps) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (tenant.currentStatus === "agenda-cerrada") {
    redirect(`/${tenant.slug}/home`);
  }

  const rules = await getAvailabilityRules(tenant.id);

  return (
    <Suspense fallback={<HorarioSkeleton slug={tenant.slug} />}>
      <HorarioClient tenant={tenant} rules={rules} />
    </Suspense>
  );
}