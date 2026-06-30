import type { APIRoute } from "astro";
import { coliving, rooms } from "../../../data/coliving";

export const GET: APIRoute = async () => {
  const availableRooms = rooms.filter((r) => r.status === "available");

  return new Response(
    JSON.stringify({
      coliving: {
        name: coliving.name,
        city: coliving.city,
        zone: coliving.zone,
        description: coliving.description,
        supplies: coliving.supplies,
        deposit: coliving.deposit,
        rules: coliving.rules,
      },
      rooms: availableRooms.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        size: r.size,
        description: r.description,
        equipment: r.equipment,
        priceAnnual: r.priceAnnual,
        priceSemester: r.priceSemester,
        priceMonthly: r.priceMonthly,
        status: r.status,
      })),
      pricing: {
        annual: "Contrato anual o curso académico",
        semester: "Contrato semestral (6 meses)",
        monthly: "Mes independiente",
        note: "Los precios varían según habitación. El precio incluye todos los suministros.",
      },
      conditions: {
        deposit: 900,
        depositNote: "La fianza es de 900 € y es obligatoria para confirmar la habitación.",
        paymentMonthly: "Domiciliación bancaria entre el 1 y el 5 de cada mes (estancias de 4+ meses).",
        paymentShort: "Transferencia entre el 1 y el 5 (estancias de hasta 3 meses).",
        minStay: "1 mes",
        checkout: "Vídeo del estado de la habitación, llaves en el escritorio. Revisión en 5 días y devolución de fianza si todo correcto.",
      },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};
