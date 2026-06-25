export async function sendLeadNotification(
  apiKey: string,
  to: string,
  lead: {
    name: string;
    email: string;
    phone: string;
    coliving: string;
    roomName: string;
    checkIn: string;
    durationMonths: number;
    stayType: string;
    source: string;
    notes?: string;
  }
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "HOM.ESTATE <noreply@hom.estate>",
      to,
      subject: `Nuevo lead — ${lead.name} — ${lead.coliving}`,
      html: `
        <h2>Nuevo lead recibido</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px">
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Nombre</td><td style="padding:8px;border:1px solid #eee">${lead.name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Email</td><td style="padding:8px;border:1px solid #eee">${lead.email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Teléfono</td><td style="padding:8px;border:1px solid #eee">${lead.phone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Coliving</td><td style="padding:8px;border:1px solid #eee">${lead.coliving}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Habitación</td><td style="padding:8px;border:1px solid #eee">${lead.roomName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Entrada</td><td style="padding:8px;border:1px solid #eee">${lead.checkIn}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Duración</td><td style="padding:8px;border:1px solid #eee">${lead.durationMonths} mes(es) — ${lead.stayType}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Fuente</td><td style="padding:8px;border:1px solid #eee">${lead.source}</td></tr>
          ${lead.notes ? `<tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Notas</td><td style="padding:8px;border:1px solid #eee">${lead.notes}</td></tr>` : ""}
        </table>
        <p style="margin-top:24px;color:#666">Accede a <a href="https://airtable.com">Airtable</a> para gestionar este lead.</p>
      `,
    }),
  });

  if (!res.ok) {
    console.error("Resend error:", await res.text());
  }
}

export async function sendPaymentLink(
  apiKey: string,
  to: string,
  guestName: string,
  paymentLink: string,
  roomName: string,
  coliving: string
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "HOM.ESTATE <noreply@hom.estate>",
      to,
      subject: `Reserva tu habitación — ${roomName} en ${coliving}`,
      html: `
        <h2>Hola ${guestName},</h2>
        <p>Hemos comprobado la disponibilidad y tu habitación <strong>${roomName}</strong> en <strong>${coliving}</strong> está disponible para las fechas que solicitaste.</p>
        <p>Para confirmar la reserva, solo tienes que abonar la fianza de <strong>900 €</strong>. Una vez recibida, la habitación queda bloqueada para ti.</p>
        <p style="margin:32px 0">
          <a href="${paymentLink}" style="background:#e94560;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px">
            Pagar fianza (900 €)
          </a>
        </p>
        <p style="color:#666;font-size:14px">Si tienes alguna duda, llámanos o escríbenos. Estaremos encantados de ayudarte.</p>
        <p style="color:#666;font-size:14px">— Equipo HOM.ESTATE</p>
      `,
    }),
  });

  if (!res.ok) {
    console.error("Resend error:", await res.text());
  }
}

export async function sendBookingConfirmation(
  apiKey: string,
  to: string,
  guestName: string,
  roomName: string,
  coliving: string,
  checkIn: string
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "HOM.ESTATE <noreply@hom.estate>",
      to,
      subject: `¡Reserva confirmada! — ${roomName} en ${coliving}`,
      html: `
        <h2>¡Reserva confirmada, ${guestName}!</h2>
        <p>Tu fianza ha sido recibida correctamente. Tu habitación <strong>${roomName}</strong> en <strong>${coliving}</strong> queda reservada a partir del <strong>${checkIn}</strong>.</p>
        <p>Pronto nos pondremos en contacto contigo para coordinar los detalles de entrada y entregarte las llaves.</p>
        <p style="color:#666;font-size:14px">— Equipo HOM.ESTATE</p>
      `,
    }),
  });

  if (!res.ok) {
    console.error("Resend error:", await res.text());
  }
}
