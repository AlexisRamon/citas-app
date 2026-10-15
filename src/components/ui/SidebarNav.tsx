"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Settings,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "tudominio.com";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const ITEMS: NavItem[] = [
  { label: "Hoy", href: "/doctor", icon: LayoutDashboard },
  { label: "Disponibilidad", href: "/doctor/disponibilidad", icon: CalendarDays },
  { label: "Citas", href: "/doctor/citas", icon: CalendarCheck },
  { label: "Configuración", href: "/doctor/configuracion", icon: Settings },
  { label: "Código QR", href: "/doctor/qr", icon: QrCode },
];

type SidebarNavProps = {
  slug: string;
  doctorName: string;
  initials: string;
  specialty?: string;
  activeHref?: string;
};

export function SidebarNav({
  slug,
  doctorName,
  initials,
  specialty,
  activeHref,
}: SidebarNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | undefined>(
    undefined,
  );
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function isActive(href: string) {
    if (activeHref) return href === activeHref;
    if (href === "/doctor") return pathname === "/doctor";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleSignOut() {
    setSignOutError(undefined);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setSignOutError("No pudimos cerrar la sesión. Inténtalo de nuevo.");
      return;
    }

    router.push("/doctor/login");
    router.refresh();
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-border bg-surface px-ds-4 py-ds-3 lg:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="doctor-sidebar"
          className="flex size-[44px] items-center justify-center rounded-sm text-text"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <p className="text-14 font-bold text-text">{doctorName}</p>
        <div
          aria-hidden="true"
          className="flex size-[40px] items-center justify-center rounded-md bg-surface-soft"
        >
          <span className="text-16 font-bold text-primary">{initials}</span>
        </div>
      </header>

      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-text/40 transition-[opacity,visibility] duration-300 ease-out lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />

      <aside
        id="doctor-sidebar"
        aria-label="Panel del doctor"
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] shrink-0 flex-col gap-ds-6 overflow-y-auto border-r border-border bg-surface p-ds-4 transition-[transform,visibility] duration-300 ease-out lg:visible lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          open ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-ds-3">
          <div className="flex min-w-0 items-center gap-ds-3">
            <div
              aria-hidden="true"
              className="flex size-[40px] shrink-0 items-center justify-center rounded-md bg-surface-soft"
            >
              <span className="text-20 font-bold text-primary">{initials}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-ds-1">
              <p className="truncate text-20 font-bold text-text">
                {doctorName}
              </p>
              {specialty ? (
                <p className="truncate text-14 text-text-muted">{specialty}</p>
              ) : null}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => {
              setOpen(false);
              menuButtonRef.current?.focus();
            }}
            aria-label="Cerrar menú"
            className="flex size-[44px] shrink-0 items-center justify-center rounded-sm text-text lg:hidden"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Navegación del panel">
          <ul className="flex flex-col gap-ds-1">
            {ITEMS.map(({ label, href, icon: Icon }) => {
              const active = isActive(href);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-[44px] items-center gap-ds-3 rounded-sm px-ds-4 text-16 ${
                      active
                        ? "bg-surface-soft font-bold text-primary"
                        : "text-text-muted hover:bg-surface-soft"
                    }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-ds-4">
          <div className="flex flex-col gap-ds-1 rounded-md bg-background p-ds-4 text-14">
            <p className="font-bold text-text">Tu consultorio en línea</p>
            <a
              href={`/${slug}/home`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center break-all text-primary underline"
            >
              {PUBLIC_DOMAIN}/{slug}
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          </div>

          <div className="flex flex-col gap-ds-1 border-t border-border pt-ds-4">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex min-h-[44px] items-center gap-ds-3 rounded-sm px-ds-4 text-left text-14 text-text-muted hover:bg-surface-soft"
            >
              <LogOut size={16} aria-hidden="true" />
              Cerrar sesión
            </button>
            {signOutError ? (
              <p role="alert" className="px-ds-4 text-14 text-danger">
                {signOutError}
              </p>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}