"use client";

import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { QRCard } from "@/components/ui/QRCard";

export type QRTenant = {
  slug: string;
  name: string;
  initials: string;
  specialty: string | null;
};

const CONFIGURED_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN;
const PUBLIC_DOMAIN = CONFIGURED_DOMAIN ?? "tudominio.com";

type QRClientProps = {
  tenant: QRTenant;
};

export function QRClient({ tenant }: QRClientProps) {
  return (
    <div className="flex flex-col gap-ds-6">
      <PageHeader
        title="Código QR"
        subtitle="Comparte el acceso a tu consultorio."
      />

      {CONFIGURED_DOMAIN ? null : (
        <Alert
          variant="warning"
          title="Estás usando un dominio de ejemplo"
          description="Define NEXT_PUBLIC_APP_DOMAIN antes de imprimir el código QR; de lo contrario apuntará a tudominio.com."
        />
      )}

      <div className="flex justify-center py-ds-4">
        <QRCard
          title="Tu código QR"
          description="Imprímelo y colócalo en la entrada de tu consultorio."
          url={`${PUBLIC_DOMAIN}/${tenant.slug}`}
          slug={tenant.slug}
          reference={tenant.name}
          detail="Consultorio"
        />
      </div>
    </div>
  );
}