import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
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

  return (
    <Suspense fallback={<HorarioSkeleton slug={tenant.slug} />}>
      <HorarioClient tenant={tenant} />
    </Suspense>
  );
}