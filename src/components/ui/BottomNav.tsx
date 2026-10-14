import Link from "next/link";
import { CalendarCheck, Home } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  ariaLabel: string;
};

type BottomNavProps = {
  slug: string;
  activeHref: string;
};

export function BottomNav({ slug, activeHref }: BottomNavProps) {
  const items: NavItem[] = [
    {
      label: "Inicio",
      href: `/${slug}/home`,
      icon: Home,
      ariaLabel: "Ir al inicio",
    },
    {
      label: "Mis citas",
      href: `/${slug}/mi-cita`,
      icon: CalendarCheck,
      ariaLabel: "Ver mi cita",
    },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex h-[64px] items-center justify-between px-ds-7">
        {items.map(({ label, href, icon: Icon, ariaLabel }) => {
          const isActive = href === activeHref;

          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={ariaLabel}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[44px] w-[92px] flex-col items-center justify-center gap-ds-1 text-14 ${
                  isActive ? "font-bold text-primary" : "text-text-muted"
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
  );
}