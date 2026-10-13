import { BadgeCheck, CircleX, LockKeyhole, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type BadgeVariant = "invitado" | "verificado" | "ocupado" | "cancelada";

type BadgeProps = {
  variant: BadgeVariant;
  label?: string;
};

const config: Record<
  BadgeVariant,
  { classes: string; icon: LucideIcon; defaultLabel: string }
> = {
  invitado: {
    classes: "bg-disabled text-text-muted",
    icon: UserRound,
    defaultLabel: "Invitado",
  },
  verificado: {
    classes: "bg-surface-soft text-success",
    icon: BadgeCheck,
    defaultLabel: "Verificado",
  },
  ocupado: {
    classes: "bg-disabled text-text-muted",
    icon: LockKeyhole,
    defaultLabel: "Ocupado",
  },
  cancelada: {
    classes: "bg-danger-soft text-danger",
    icon: CircleX,
    defaultLabel: "Cancelada",
  },
};

export function Badge({ variant, label }: BadgeProps) {
  const { classes, icon: Icon, defaultLabel } = config[variant];

  return (
    <span
      className={`inline-flex items-center gap-ds-2 rounded-sm px-ds-3 py-ds-2 text-14 font-bold ${classes}`}
    >
      <Icon size={16} aria-hidden="true" />
      {label ?? defaultLabel}
    </span>
  );
}