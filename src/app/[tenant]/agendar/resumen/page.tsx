import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { ResumenClient } from "./ResumenClient";

type PageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function ResumenPage({ params }: PageProps) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (tenant.currentStatus === "agenda-cerrada") {
    redirect(`/${tenant.slug}/home`);
  }

  return (
    <Suspense fallback={null}>
      <ResumenClient tenant={tenant} />
    </Suspense>
  );
}
