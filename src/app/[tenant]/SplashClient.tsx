"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Tenant } from "@/lib/tenant";

type SplashClientProps = {
  tenant: Tenant;
};

export function SplashClient({ tenant }: SplashClientProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(
      () => router.push(`/${tenant.slug}/home`),
      1500,
    );
    return () => clearTimeout(timer);
  }, [router, tenant.slug]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-between overflow-hidden bg-primary px-ds-7 py-ds-8 text-center text-surface">
      <p className="text-14 font-bold uppercase">Cuidado cercano</p>

      <div className="relative flex w-full flex-col items-center gap-ds-6">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 size-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 size-[328px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface"
        />

        <div
          aria-hidden="true"
          className="relative flex size-[112px] items-center justify-center rounded-lg bg-surface"
        >
          <span className="text-32 font-bold text-primary">
            {tenant.initials}
          </span>
        </div>

        <div className="relative flex w-full flex-col gap-ds-2">
          <h1 className="text-32 font-bold">{tenant.name}</h1>
          {tenant.specialty ? (
            <p className="text-16">{tenant.specialty}</p>
          ) : null}
        </div>
      </div>

      <div className="flex w-full flex-col gap-ds-3">
        <p className="text-24 font-bold">Tu salud, a tu ritmo.</p>
        <p className="text-14">
          Agenda tu consulta de forma sencilla, sin crear una cuenta.
        </p>
      </div>
    </main>
  );
}