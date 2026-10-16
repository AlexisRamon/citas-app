type TenantIdentityProps = {
  initials: string;
  name: string;
  specialty?: string | null;
  size: "sm" | "lg";
};

export function TenantIdentity({
  initials,
  name,
  specialty,
  size,
}: TenantIdentityProps) {
  const isLarge = size === "lg";

  return (
    <div
      className={
        isLarge
          ? "flex flex-col items-center gap-ds-4 text-center"
          : "flex items-center gap-ds-3"
      }
    >
      <div
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center bg-surface-soft font-bold text-primary ${
          isLarge ? "size-[72px] rounded-lg text-32" : "size-[48px] rounded-md text-16"
        }`}
      >
        {initials}
      </div>

      <div className="flex min-w-0 flex-col gap-ds-1">
        <p
          className={`font-bold text-text ${isLarge ? "text-20" : "text-16"}`}
        >
          {name}
        </p>
        {isLarge && specialty ? (
          <p className="text-14 text-text-muted">{specialty}</p>
        ) : null}
      </div>
    </div>
  );
}