import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { OtpEmailClient } from "./OtpEmailClient";

type PageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function OtpEmailPage({ params }: PageProps) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (tenant.currentStatus === "agenda-cerrada") {
    redirect(`/${tenant.slug}/home`);
  }

  return (
    <Suspense fallback={null}>
      <OtpEmailClient tenant={tenant} />
    </Suspense>
  );
}