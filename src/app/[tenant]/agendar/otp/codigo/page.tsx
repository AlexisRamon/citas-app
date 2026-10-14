import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { OtpCodeEmailClient } from "./OtpCodeEmailClient";

type PageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function OtpCodePage({ params }: PageProps) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <Suspense fallback={null}>
      <OtpCodeEmailClient tenant={tenant} />
    </Suspense>
  );
}