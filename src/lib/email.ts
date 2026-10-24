// Correos transaccionales vía la API de Resend. Solo se usa desde el servidor
// (server actions / route handlers): RESEND_API_KEY nunca llega al navegador.

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Citas App <onboarding@resend.dev>";
const TIMEOUT_MS = 8000;

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/** Devuelve true si Resend aceptó el correo. Nunca lanza. */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? DEFAULT_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    return response.ok;
  } catch {
    return false;
  }
}

type CancellationEmailInput = {
  patientName: string;
  doctorName: string;
  dateLabel: string;
  timeLabel: string;
  address: string;
  phone: string;
  message: string;
  bookingUrl: string | null;
};

export function buildCancellationEmail(input: CancellationEmailInput) {
  const subject = `Tu cita del ${input.dateLabel} fue cancelada`;

  const text = [
    `Hola ${input.patientName},`,
    "",
    `${input.doctorName} canceló tu cita del ${input.dateLabel} a las ${input.timeLabel}.`,
    input.message ? `\nMensaje del consultorio: ${input.message}` : "",
    input.bookingUrl ? `\nPuedes agendar otra cita aquí: ${input.bookingUrl}` : "",
    input.phone ? `\nSi tienes dudas, contacta al consultorio: ${input.phone}` : "",
    input.address ? `Dirección: ${input.address}` : "",
  ]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n");

  const e = escapeHtml;

  const html = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #243b36;">
  <h2 style="margin: 0 0 12px; font-size: 20px;">Tu cita fue cancelada</h2>
  <p style="margin: 0 0 16px; font-size: 14px;">Hola ${e(input.patientName)},</p>
  <p style="margin: 0 0 16px; font-size: 14px;">
    ${e(input.doctorName)} canceló tu cita del
    <strong>${e(input.dateLabel)}</strong> a las <strong>${e(input.timeLabel)}</strong>.
  </p>
  ${
    input.message
      ? `<p style="margin: 0 0 16px; padding: 12px; background: #eaf2ec; border-radius: 8px; font-size: 14px;">
    <strong>Mensaje del consultorio:</strong><br />${e(input.message)}
  </p>`
      : ""
  }
  ${
    input.bookingUrl
      ? `<p style="margin: 0 0 16px; font-size: 14px;">
    Puedes <a href="${e(input.bookingUrl)}" style="color: #28685c;">agendar otra cita aquí</a>.
  </p>`
      : ""
  }
  ${
    input.phone || input.address
      ? `<p style="margin: 0; font-size: 12px; color: #65736e;">
    ${input.phone ? `Teléfono: ${e(input.phone)}<br />` : ""}
    ${input.address ? `Dirección: ${e(input.address)}` : ""}
  </p>`
      : ""
  }
</div>`.trim();

  return { subject, html, text };
}
