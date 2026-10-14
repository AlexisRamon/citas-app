import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { ConfirmarClient } from "./ConfirmarClient";

type PageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function ConfirmarPage({ params }: PageProps) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <Suspense fallback={null}>
      <ConfirmarClient tenant={tenant} />
    </Suspense>
  );
}