import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "disabled";

type ButtonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-surface",
  secondary: "bg-surface border border-border text-primary",
  disabled: "bg-disabled text-text-muted cursor-not-allowed",
};

export function Button({
  variant = "primary",
  children,
  icon,
  href,
  onClick,
  type = "button",
  disabled,
  className = "",
}: ButtonProps) {
  const base = `inline-flex h-control items-center justify-center gap-ds-2 rounded-md px-ds-4 text-16 font-bold transition-colors ${VARIANTS[variant]} ${className}`;
  const content = (
    <>
      {icon}
      {children}
    </>
  );

  if (href && !disabled && variant !== "disabled") {
    return (
      <Link href={href} className={base}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || variant === "disabled"}
      className={base}
    >
      {content}
    </button>
  );
}