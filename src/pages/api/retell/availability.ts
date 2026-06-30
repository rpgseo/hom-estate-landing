import type { APIRoute } from "astro";
import { getBusyPeriods } from "../../../lib/google-calendar";
import { coliving } from "../../../data/coliving";

export const GET: APIRoute = async ({ url }) => {
  const serviceAccountJson = import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "";
  const calendarId = import.meta.env.GOOGLE_CALENDAR_ID || coliving.googleCalendarId;

  const checkIn = url.searchParams.get("checkin");
  const months = parseInt(url.searchParams.get("months") ?? "3");

  if (!checkIn) {
    return new Response(JSON.stringify({ error: "checkin param required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const start = new Date(checkIn);
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);

  if (!serviceAccountJson) {
    return new Response(
      JSON.stringify({
        available: true,
        message: `En principio hay disponibilidad para la fecha ${checkIn} durante ${months} mes(es). Te lo confirma el equipo.`,
        mock: true,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const busy = await getBusyPeriods(serviceAccountJson, calendarId, start.toISOString(), end.toISOString());
    const conflict = busy.some((b) => {
      const bs = new Date(b.start).getTime();
      const be = new Date(b.end).getTime();
      return bs < end.getTime() && be > start.getTime();
    });

    return new Response(
      JSON.stringify({
        available: !conflict,
        message: conflict
          ? `Para esas fechas hay ocupación en el calendario. Te recomiendo consultar alternativas con el equipo.`
          : `Hay disponibilidad para la fecha ${checkIn} durante ${months} mes(es).`,
        checkin: checkIn,
        months,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        available: null,
        message: "No puedo confirmar disponibilidad en este momento. Te lo revisa el equipo con seguridad.",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
};
