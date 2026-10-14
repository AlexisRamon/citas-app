import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { SplashClient } from "./SplashClient";

type PageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function SplashPage({ params }: PageProps) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return <SplashClient tenant={tenant} />;
}