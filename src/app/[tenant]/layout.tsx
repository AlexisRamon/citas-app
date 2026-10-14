import { Suspense } from "react";
import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";

export const instant = false;

type TenantLayoutProps = {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
};

async function TenantShell({ children, params }: TenantLayoutProps) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) notFound();

  const style: Record<string, string> = {};
  if (tenant.primaryColor) {
    style["--color-primary"] = tenant.primaryColor;
  }
  if (tenant.primaryHoverColor) {
    style["--color-primary-hover"] = tenant.primaryHoverColor;
  }

  return (
    <div style={style as CSSProperties} className="contents">
      {children}
    </div>
  );
}

export default function TenantLayout(props: TenantLayoutProps) {
  return (
    <Suspense fallback={null}>
      <TenantShell {...props} />
    </Suspense>
  );
}