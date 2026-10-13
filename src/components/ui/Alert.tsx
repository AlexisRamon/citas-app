import { AlertCircle, Clock3, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type AlertVariant = "info" | "warning" | "danger";

type AlertProps = {
  variant: AlertVariant;
  title: string;
  description?: string;
  icon?: LucideIcon;
};

const config: Record<
  AlertVariant,
  { classes: string; icon: LucideIcon; role: "status" | "alert" }
> = {
  info: { classes: "bg-surface-soft text-primary", icon: Info, role: "status" },
  warning: {
    classes: "bg-warning-soft text-warning",
    icon: Clock3,
    role: "status",
  },
  danger: {
    classes: "bg-danger-soft text-danger",
    icon: AlertCircle,
    role: "alert",
  },
};

export function Alert({ variant, title, description, icon }: AlertProps) {
  const { classes, icon: DefaultIcon, role } = config[variant];
  const Icon = icon ?? DefaultIcon;

  return (
    <div
      role={role}
      className={`flex items-start gap-ds-3 rounded-md p-ds-4 ${classes}`}
    >
      <Icon size={20} aria-hidden="true" className="shrink-0" />
      <div className="flex flex-col">
        <p className="text-16 font-bold">{title}</p>
        {description ? (
          <p className="text-14 text-text-muted">{description}</p>
        ) : null}
      </div>
    </div>
  );
}