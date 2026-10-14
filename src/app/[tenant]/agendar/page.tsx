import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { AgendarClient } from "./AgendarClient";

type PageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function AgendarPage({ params }: PageProps) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return <AgendarClient tenant={tenant} />;
}