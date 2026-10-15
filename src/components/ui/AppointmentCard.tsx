import { Badge } from "@/components/ui/Badge";
import { formatTimeLabel } from "@/lib/format-date";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "attended"
  | "cancelled";

type AppointmentCardProps = {
  startsAt: string;
  patientName: string;
  patientEmail?: string | null;
  reason?: string | null;
  status: AppointmentStatus;
  timeZone?: string;
};

const DEFAULT_TIME_ZONE = "America/Mazatlan";

function getLocalTime(isoDate: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(isoDate));
}

export function AppointmentCard({
  startsAt,
  patientName,
  patientEmail,
  reason,
  status,
  timeZone = DEFAULT_TIME_ZONE,
}: AppointmentCardProps) {
  const [clock, ...periodParts] = formatTimeLabel(
    getLocalTime(startsAt, timeZone),
  ).split(" ");
  const period = periodParts.join(" ");

  const details = [patientEmail, reason].filter(Boolean).join("   ·   ");

  return (
    <article className="flex items-center gap-ds-4 rounded-md border border-border bg-surface p-ds-5">
      <time
        dateTime={startsAt}
        className="flex h-[64px] w-[58px] shrink-0 flex-col items-center justify-center rounded-sm bg-surface-soft font-bold text-primary"
      >
        <span className="text-16">{clock}</span>
        {period ? <span className="text-14">{period}</span> : null}
      </time>

      <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
        <p className="truncate text-20 font-bold text-text">{patientName}</p>
        {details ? (
          <p className="truncate text-14 text-text-muted">{details}</p>
        ) : null}
      </div>

      {status === "cancelled" ? <Badge variant="cancelada" /> : null}
    </article>
  );
}