import type { APIRoute } from "astro";
import { createLead } from "../../../lib/airtable";
import { sendLeadNotification } from "../../../lib/resend";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ request }) => {
  const cfEnv = env as unknown as Record<string, string>;
  const airtableKey = cfEnv.AIRTABLE_API_KEY ?? "";
  const airtableBase = cfEnv.AIRTABLE_BASE_ID ?? "";
  const resendKey = cfEnv.RESEND_API_KEY ?? "";
  const notifyEmail = cfEnv.NOTIFY_EMAIL ?? "ramonpg91@gmail.com";

  let body: Record<string, string>;
  try {
    body = await request.json() as Record<string, string>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { name, email, phone, roomName, checkIn, durationMonths, stayType, notes } = body;

  if (!name || !phone) {
    return new Response(JSON.stringify({ error: "name and phone are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const leadData = {
    name,
    email: email ?? "",
    phone,
    coliving: "Coliving Delicias — Zaragoza",
    roomName: roomName ?? "No especificada",
    checkIn: checkIn ?? "",
    durationMonths: durationMonths ? parseInt(durationMonths) : 1,
    stayType: stayType ?? "mensual",
    source: "vapi",
    notes,
  };

  if (airtableKey && airtableBase) {
    try {
      await createLead(airtableKey, airtableBase, leadData);
    } catch (e) {
      console.error("Airtable save failed:", e);
    }
  }

  if (resendKey) {
    try {
      await sendLeadNotification(resendKey, notifyEmail, leadData);
    } catch (e) {
      console.error("Resend notification failed:", e);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: "Lead registrado correctamente. El equipo se pondrá en contacto pronto.",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};
