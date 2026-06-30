import type { APIRoute } from "astro";
import { updateLead } from "../../../lib/airtable";
import { sendPaymentLink } from "../../../lib/resend";

export const GET: APIRoute = async ({ url }) => {
  const stripeKey = import.meta.env.STRIPE_SECRET_KEY ?? "";
  const airtableKey = import.meta.env.AIRTABLE_API_KEY ?? "";
  const airtableBase = import.meta.env.AIRTABLE_BASE_ID ?? "";
  const resendKey = import.meta.env.RESEND_API_KEY ?? "";
  const internalToken = import.meta.env.INTERNAL_API_TOKEN ?? "";

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

  const stripeRes = await fetch("https://api.stripe.com/v1/payment_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][product_data][name]": `Fianza habitación — ${roomName} en ${coliving}`,
      "line_items[0][price_data][unit_amount]": "90000",
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

  if (airtableKey && airtableBase) {
    try {
      await updateLead(airtableKey, airtableBase, leadId, {
        Estado: "link enviado",
        "Stripe Payment Link": stripeData.url,
        "Stripe Payment ID": stripeData.id ?? "",
      });
    } catch (e) {
      console.error("Airtable update failed:", e);
    }
  }

  if (resendKey) {
    try {
      await sendPaymentLink(resendKey, guestEmail, guestName, stripeData.url, roomName, coliving);
    } catch (e) {
      console.error("Resend failed:", e);
    }
  }

  return new Response(JSON.stringify({ success: true, paymentLink: stripeData.url }), {
    headers: { "Content-Type": "application/json" },
  });
};
