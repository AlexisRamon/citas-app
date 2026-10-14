import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { OtpPhoneClient } from "./OtpPhoneClient";

type PageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function OtpPhonePage({ params }: PageProps) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <Suspense fallback={null}>
      <OtpPhoneClient tenant={tenant} />
    </Suspense>
  );
}