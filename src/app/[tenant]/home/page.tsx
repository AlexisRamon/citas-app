import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { HomeClient } from "./HomeClient";

type PageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  return <HomeClient tenant={tenant} />;
}