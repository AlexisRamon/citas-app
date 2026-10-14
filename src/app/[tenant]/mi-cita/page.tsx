import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { MiCitaClient } from "./MiCitaClient";

type PageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function MiCitaPage({ params }: PageProps) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return <MiCitaClient tenant={tenant} />;
}