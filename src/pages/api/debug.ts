import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const calendarId = import.meta.env.GOOGLE_CALENDAR_ID ?? "NOT SET";
  const jsonRaw = import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "NOT SET";

  let jsonStatus = "NOT SET";
  let clientEmail = "";
  let hasPrivateKey = false;

  if (jsonRaw && jsonRaw !== "NOT SET") {
    try {
      const parsed = JSON.parse(jsonRaw) as { client_email?: string; private_key?: string };
      jsonStatus = "PARSED OK";
      clientEmail = parsed.client_email ?? "missing";
      hasPrivateKey = !!parsed.private_key;
    } catch (e) {
      jsonStatus = `PARSE ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return new Response(
    JSON.stringify({ calendarId, jsonStatus, clientEmail, hasPrivateKey }, null, 2),
    { headers: { "Content-Type": "application/json" } }
  );
};
