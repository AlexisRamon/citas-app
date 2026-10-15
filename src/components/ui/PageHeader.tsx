import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-ds-4">
      <div className="flex min-w-0 flex-col gap-ds-1">
        <h1 className="text-24 font-bold text-text">{title}</h1>
        {subtitle ? (
          <p className="text-14 text-text-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-ds-3">{actions}</div>
      ) : null}
    </header>
  );
}