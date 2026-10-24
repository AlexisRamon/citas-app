import { escapeHtml } from "@/lib/email";

type ConfirmationEmailInput = {
  patientName: string;
  doctorName: string;
  dateLabel: string;
  timeLabel: string;
  address: string;
  phone: string;
  myAppointmentsUrl: string | null;
};

export function buildConfirmationEmail(input: ConfirmationEmailInput) {
  const subject = `Cita confirmada: ${input.dateLabel} a las ${input.timeLabel}`;

  const text = [
    `Hola ${input.patientName},`,
    "",
    `Tu cita con ${input.doctorName} quedó confirmada.`,
    "",
    `Fecha: ${input.dateLabel}`,
    `Hora: ${input.timeLabel}`,
    input.address ? `Dirección: ${input.address}` : "",
    input.phone ? `Teléfono: ${input.phone}` : "",
    input.myAppointmentsUrl ? `\nPuedes ver tus citas aquí: ${input.myAppointmentsUrl}` : "",
    "\nSi no puedes asistir, contacta al consultorio con anticipación.",
  ]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n");

  const e = escapeHtml;

  const rows = [
    ["Doctor", input.doctorName],
    ["Fecha", input.dateLabel],
    ["Hora", input.timeLabel],
    ["Dirección", input.address],
    ["Teléfono", input.phone],
  ].filter(([, value]) => value);

  const html = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #243b36;">
  <h2 style="margin: 0 0 12px; font-size: 20px;">¡Cita confirmada!</h2>
  <p style="margin: 0 0 16px; font-size: 14px;">Hola ${e(input.patientName)}, tu cita quedó agendada.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 0 0 16px; font-size: 14px;">
    ${rows
      .map(
        ([label, value]) => `<tr>
      <td style="padding: 8px 0; color: #65736e; width: 96px; vertical-align: top;">${e(label)}</td>
      <td style="padding: 8px 0; font-weight: bold;">${e(value)}</td>
    </tr>`,
      )
      .join("")}
  </table>
  ${
    input.myAppointmentsUrl
      ? `<p style="margin: 0 0 16px; font-size: 14px;">
    <a href="${e(input.myAppointmentsUrl)}" style="color: #28685c;">Ver mis citas</a>
  </p>`
      : ""
  }
  <p style="margin: 0; font-size: 12px; color: #65736e;">
    Si no puedes asistir, contacta al consultorio con anticipación.
  </p>
</div>`.trim();

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Avisos simples (consultorio y cancelación del paciente)
// ---------------------------------------------------------------------------

type SimpleEmailInput = {
  title: string;
  lines: string[];
  link?: { label: string; url: string } | null;
  footer?: string;
};

function buildSimpleEmail(input: SimpleEmailInput) {
  const e = escapeHtml;

  const text = [
    ...input.lines,
    input.link ? `\n${input.link.label}: ${input.link.url}` : "",
    input.footer ? `\n${input.footer}` : "",
  ]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n");

  const html = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #243b36;">
  <h2 style="margin: 0 0 12px; font-size: 20px;">${e(input.title)}</h2>
  ${input.lines
    .map((line) => `<p style="margin: 0 0 12px; font-size: 14px;">${e(line)}</p>`)
    .join("")}
  ${
    input.link
      ? `<p style="margin: 0 0 16px; font-size: 14px;"><a href="${e(input.link.url)}" style="color: #28685c;">${e(input.link.label)}</a></p>`
      : ""
  }
  ${input.footer ? `<p style="margin: 0; font-size: 12px; color: #65736e;">${e(input.footer)}</p>` : ""}
</div>`.trim();

  return { html, text };
}

type ClinicAppointmentEmailInput = {
  patientName: string;
  patientEmail: string;
  dateLabel: string;
  timeLabel: string;
  agendaUrl: string | null;
};

export function buildClinicNewBookingEmail(input: ClinicAppointmentEmailInput) {
  return {
    subject: `Nueva cita: ${input.dateLabel} a las ${input.timeLabel}`,
    ...buildSimpleEmail({
      title: "Nueva cita agendada",
      lines: [
        `${input.patientName} (${input.patientEmail}) agendó una cita.`,
        `Fecha: ${input.dateLabel}`,
        `Hora: ${input.timeLabel}`,
      ],
      link: input.agendaUrl ? { label: "Ver mis citas", url: input.agendaUrl } : null,
    }),
  };
}

export function buildClinicCancelledByPatientEmail(input: ClinicAppointmentEmailInput) {
  return {
    subject: `Cita cancelada por el paciente: ${input.dateLabel} a las ${input.timeLabel}`,
    ...buildSimpleEmail({
      title: "Un paciente canceló su cita",
      lines: [
        `${input.patientName} (${input.patientEmail}) canceló su cita.`,
        `Fecha: ${input.dateLabel}`,
        `Hora: ${input.timeLabel}`,
        "El horario quedó libre para otros pacientes.",
      ],
      link: input.agendaUrl ? { label: "Ver mis citas", url: input.agendaUrl } : null,
    }),
  };
}

type PatientSelfCancelEmailInput = {
  patientName: string;
  doctorName: string;
  dateLabel: string;
  timeLabel: string;
  bookingUrl: string | null;
};

export function buildPatientSelfCancelEmail(input: PatientSelfCancelEmailInput) {
  return {
    subject: `Cancelaste tu cita del ${input.dateLabel}`,
    ...buildSimpleEmail({
      title: "Tu cita fue cancelada",
      lines: [
        `Hola ${input.patientName},`,
        `Cancelaste tu cita con ${input.doctorName} del ${input.dateLabel} a las ${input.timeLabel}.`,
      ],
      link: input.bookingUrl
        ? { label: "Agendar otra cita", url: input.bookingUrl }
        : null,
      footer: "Si no fuiste tú, contacta al consultorio.",
    }),
  };
}
