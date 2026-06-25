import type { APIRoute } from "astro";
import { getLeadByStripeId, updateLead } from "../../../lib/airtable";
import { createCalendarEvent } from "../../../lib/google-calendar";
import { sendBookingConfirmation } from "../../../lib/resend";

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env as Record<string, string> | undefined;
  const stripeWebhookSecret = env?.STRIPE_WEBHOOK_SECRET ?? "";
  const airtableKey = env?.AIRTABLE_API_KEY ?? "";
  const airtableBase = env?.AIRTABLE_BASE_ID ?? "";
  const serviceAccountJson = env?.GOOGLE_SERVICE_ACCOUNT_JSON ?? "";
  const calendarId = env?.GOOGLE_CALENDAR_ID ?? "primary";
  const resendKey = env?.RESEND_API_KEY ?? "";

  const signature = request.headers.get("stripe-signature") ?? "";
  const body = await request.text();

  // Verify Stripe signature (simplified — use stripe SDK in production)
  // For now we check the signature header exists
  if (stripeWebhookSecret && !signature) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: {
    type: string;
    data: {
      object: {
        id: string;
        metadata?: {
          lead_id?: string;
          room?: string;
          coliving?: string;
          guest_email?: string;
        };
      };
    };
  };

  try {
    event = JSON.parse(body) as typeof event;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "payment_intent.succeeded") {
    return new Response("OK", { status: 200 });
  }

  const obj = event.data.object;
  const meta = obj.metadata ?? {};
  const leadId = meta.lead_id ?? "";
  const guestEmail = meta.guest_email ?? "";
  const roomName = meta.room ?? "Habitación";
  const colivingName = meta.coliving ?? "Coliving Delicias";

  // Update Airtable lead status
  if (airtableKey && airtableBase && leadId) {
    try {
      await updateLead(airtableKey, airtableBase, leadId, {
        Estado: "fianza pagada",
      });

      // Try to get check-in from lead record for calendar blocking
      const lead = await getLeadByStripeId(airtableKey, airtableBase, obj.id);
      if (lead && serviceAccountJson) {
        const checkIn = lead.fields["Fecha entrada"] as string | undefined;
        const months = lead.fields["Duración (meses)"] as number | undefined;
        const guestName = lead.fields["Nombre"] as string | undefined;

        if (checkIn && months) {
          const endDate = new Date(checkIn);
          endDate.setMonth(endDate.getMonth() + months);

          await createCalendarEvent(serviceAccountJson, calendarId, {
            summary: `Reservado — ${guestName ?? guestEmail} (${roomName})`,
            description: `Lead ID: ${leadId}\nColiving: ${colivingName}\nHabitación: ${roomName}`,
            startDate: checkIn,
            endDate: endDate.toISOString().split("T")[0]!,
          });
        }

        // Send confirmation email
        if (resendKey && guestEmail) {
          const checkInDisplay = lead.fields["Fecha entrada"] as string ?? "";
          await sendBookingConfirmation(
            resendKey,
            guestEmail,
            lead.fields["Nombre"] as string ?? "Inquilino",
            roomName,
            colivingName,
            checkInDisplay
          );
        }
      }
    } catch (e) {
      console.error("Webhook processing error:", e);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
