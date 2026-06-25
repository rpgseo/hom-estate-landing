import type { APIRoute } from "astro";
import { getBusyPeriods } from "../../lib/google-calendar";
import { coliving } from "../../data/coliving";
import { env } from "cloudflare:workers";

export const GET: APIRoute = async ({ url }) => {
  const cfEnv = env as unknown as Record<string, string>;

  const serviceAccountJson = cfEnv.GOOGLE_SERVICE_ACCOUNT_JSON ?? "";
  const calendarId = cfEnv.GOOGLE_CALENDAR_ID ?? coliving.googleCalendarId;

  const monthParam = url.searchParams.get("month");
  const now = new Date();
  const year = monthParam ? parseInt(monthParam.split("-")[0]!) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam.split("-")[1]!) - 1 : now.getMonth();

  const timeMin = new Date(year, month, 1).toISOString();
  const timeMax = new Date(year, month + 3, 1).toISOString();

  if (!serviceAccountJson) {
    return new Response(
      JSON.stringify({
        busy: [
          { start: `${year}-${String(month + 1).padStart(2, "0")}-05`, end: `${year}-${String(month + 1).padStart(2, "0")}-15` },
          { start: `${year}-${String(month + 1).padStart(2, "0")}-20`, end: `${year}-${String(month + 1).padStart(2, "0")}-28` },
        ],
        mock: true,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const busy = await getBusyPeriods(serviceAccountJson, calendarId, timeMin, timeMax);
    return new Response(JSON.stringify({ busy }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("availability error:", msg);
    return new Response(JSON.stringify({ busy: [], error: msg }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
