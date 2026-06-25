import type { APIRoute } from "astro";
import { updateLead, getLeadByStripeId } from "../../../lib/airtable";
import { sendPaymentLink } from "../../../lib/resend";

// Called by the team from Airtable / internal use to generate a Stripe payment link for a lead
export const GET: APIRoute = async ({ url, locals }) => {
  const env = locals.runtime?.env as Record<string, string> | undefined;
  const stripeKey = env?.STRIPE_SECRET_KEY ?? "";
  const airtableKey = env?.AIRTABLE_API_KEY ?? "";
  const airtableBase = env?.AIRTABLE_BASE_ID ?? "";
  const resendKey = env?.RESEND_API_KEY ?? "";
  const internalToken = env?.INTERNAL_API_TOKEN ?? "";

  // Basic auth for internal endpoint
  const token = url.searchParams.get("token");
  if (internalToken && token !== internalToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const leadId = url.searchParams.get("lead_id");
  const guestName = url.searchParams.get("name") ?? "";
  const guestEmail = url.searchParams.get("email") ?? "";
  const roomName = url.searchParams.get("room") ?? "Habitación";
  const coliving = url.searchParams.get("coliving") ?? "Coliving Delicias";

  if (!leadId || !guestEmail) {
    return new Response(JSON.stringify({ error: "lead_id and email required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!stripeKey) {
    return new Response(
      JSON.stringify({ error: "Stripe not configured", mock_link: "https://buy.stripe.com/test_example" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Create Stripe Payment Link
  const stripeRes = await fetch("https://api.stripe.com/v1/payment_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][product_data][name]": `Fianza habitación — ${roomName} en ${coliving}`,
      "line_items[0][price_data][unit_amount]": "90000", // 900.00 EUR in cents
      "line_items[0][quantity]": "1",
      "metadata[lead_id]": leadId,
      "metadata[room]": roomName,
      "metadata[coliving]": coliving,
      "metadata[guest_email]": guestEmail,
    }),
  });

  const stripeData = (await stripeRes.json()) as { url?: string; id?: string; error?: { message: string } };

  if (!stripeData.url) {
    return new Response(
      JSON.stringify({ error: stripeData.error?.message ?? "Stripe error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const paymentLink = stripeData.url;
  const paymentId = stripeData.id ?? "";

  // Update lead in Airtable
  if (airtableKey && airtableBase) {
    try {
      await updateLead(airtableKey, airtableBase, leadId, {
        Estado: "link enviado",
        "Stripe Payment Link": paymentLink,
        "Stripe Payment ID": paymentId,
      });
    } catch (e) {
      console.error("Airtable update failed:", e);
    }
  }

  // Send email to guest
  if (resendKey) {
    try {
      await sendPaymentLink(resendKey, guestEmail, guestName, paymentLink, roomName, coliving);
    } catch (e) {
      console.error("Resend failed:", e);
    }
  }

  return new Response(JSON.stringify({ success: true, paymentLink }), {
    headers: { "Content-Type": "application/json" },
  });
};
