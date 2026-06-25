const BASE_URL = "https://api.airtable.com/v0";

function headers(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export async function createLead(
  apiKey: string,
  baseId: string,
  data: {
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
  const res = await fetch(`${BASE_URL}/${baseId}/Leads`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({
      fields: {
        Nombre: data.name,
        Email: data.email,
        Teléfono: data.phone,
        Coliving: data.coliving,
        "Habitación": data.roomName,
        "Fecha entrada": data.checkIn,
        "Duración meses": data.durationMonths,
        "Tipo estancia": data.stayType,
        Fuente: data.source,
        Estado: "nuevo",
        Notas: data.notes ?? "",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable error: ${err}`);
  }

  return res.json();
}

export async function updateLead(
  apiKey: string,
  baseId: string,
  recordId: string,
  fields: Record<string, unknown>
) {
  const res = await fetch(`${BASE_URL}/${baseId}/Leads/${recordId}`, {
    method: "PATCH",
    headers: headers(apiKey),
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable error: ${err}`);
  }

  return res.json();
}

export async function getLeadByStripeId(
  apiKey: string,
  baseId: string,
  stripePaymentId: string
) {
  const formula = encodeURIComponent(`{Stripe Payment ID} = "${stripePaymentId}"`);
  const res = await fetch(
    `${BASE_URL}/${baseId}/Leads?filterByFormula=${formula}&maxRecords=1`,
    { headers: headers(apiKey) }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as { records: Array<{ id: string; fields: Record<string, unknown> }> };
  return data.records[0] ?? null;
}
