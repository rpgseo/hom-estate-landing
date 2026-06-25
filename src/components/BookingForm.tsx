import { useState } from "react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Room {
  id: string;
  name: string;
  type: string;
  priceAnnual: number;
  priceSemester: number;
  priceMonthly: number;
  status: string;
}

interface Props {
  rooms: Room[];
}

type StayType = "anual" | "semestral" | "mensual";
type Step = "dates" | "details" | "success";

const STAY_LABELS: Record<StayType, string> = {
  anual: "Anual / curso académico",
  semestral: "Semestral (6 meses)",
  mensual: "Mes independiente",
};

const DURATION_MONTHS: Record<StayType, number> = {
  anual: 12,
  semestral: 6,
  mensual: 1,
};

export default function BookingForm({ rooms }: Props) {
  const [step, setStep] = useState<Step>("dates");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [stayType, setStayType] = useState<StayType>("anual");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [error, setError] = useState("");

  const availableRooms = rooms.filter((r) => r.status === "available");

  function priceForStay(room: Room): number {
    if (stayType === "anual") return room.priceAnnual;
    if (stayType === "semestral") return room.priceSemester;
    return room.priceMonthly;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedRoom) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          roomId: selectedRoom.id,
          roomName: selectedRoom.name,
          checkIn: format(selectedDate, "yyyy-MM-dd"),
          durationMonths: String(DURATION_MONTHS[stayType]),
          stayType,
          notes: form.notes,
        }),
      });

      if (!res.ok) throw new Error("Error al enviar");
      setStep("success");
    } catch {
      setError("Hubo un problema al enviar. Llámanos directamente al +34 636 155 847.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "success") {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✓</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud recibida!</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Hemos recibido tu solicitud para <strong>{selectedRoom?.name}</strong>. Revisaremos la disponibilidad
          y nos pondremos en contacto contigo en menos de 24 horas.
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Recuerda: la habitación solo queda reservada tras el pago de la fianza (900 €).
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div
          className={`flex items-center gap-2 text-sm font-medium ${step === "dates" ? "text-rose-600" : "text-gray-400"}`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "dates" ? "bg-rose-600 text-white" : "bg-gray-200 text-gray-600"}`}
          >
            1
          </span>
          Fechas y habitación
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div
          className={`flex items-center gap-2 text-sm font-medium ${step === "details" ? "text-rose-600" : "text-gray-400"}`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "details" ? "bg-rose-600 text-white" : "bg-gray-200 text-gray-600"}`}
          >
            2
          </span>
          Tus datos
        </div>
      </div>

      {step === "dates" && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Calendar */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Fecha de entrada</h3>
            <AvailabilityCalendar onDateSelect={setSelectedDate} selectedDate={selectedDate} />
            {selectedDate && (
              <p className="text-center text-sm text-gray-600 mt-2">
                Entrada: <strong>{format(selectedDate, "d 'de' MMMM yyyy", { locale: es })}</strong>
              </p>
            )}
          </div>

          {/* Room + stay type selection */}
          <div className="flex flex-col gap-6">
            {/* Stay type */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Duración de la estancia</h3>
              <div className="flex flex-col gap-2">
                {(["anual", "semestral", "mensual"] as StayType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setStayType(type)}
                    className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      stayType === type
                        ? "border-rose-600 bg-rose-50 text-rose-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-medium">{STAY_LABELS[type]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Room selection */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Habitación</h3>
              {availableRooms.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay habitaciones disponibles en este momento.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {availableRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedRoom?.id === room.id
                          ? "border-rose-600 bg-rose-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{room.name}</span>
                        <span className="font-bold text-rose-600">{priceForStay(room)} €/mes</span>
                      </div>
                      <span className="text-xs text-gray-500 capitalize">{room.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setStep("details")}
              disabled={!selectedDate || !selectedRoom}
              className="mt-auto w-full py-3 px-6 bg-rose-600 text-white rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-700 transition-colors"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {step === "details" && (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col gap-5">
          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Habitación</span>
              <span className="font-semibold">{selectedRoom?.name}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-600">Entrada</span>
              <span className="font-semibold">
                {selectedDate ? format(selectedDate, "d MMM yyyy", { locale: es }) : ""}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-600">Duración</span>
              <span className="font-semibold">{STAY_LABELS[stayType]}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-600">Precio</span>
              <span className="font-bold text-rose-600">
                {selectedRoom ? priceForStay(selectedRoom) : 0} €/mes
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Tu nombre y apellidos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="+34 600 000 000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
              rows={3}
              placeholder="¿Algo que debamos saber? Perfil, motivo de la estancia..."
            />
          </div>

          <p className="text-xs text-gray-400">
            Esta solicitud no confirma la reserva. El equipo revisará la disponibilidad y te enviará
            el enlace de pago de la fianza (900 €) para confirmar.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("dates")}
              className="flex-1 py-3 px-6 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ← Volver
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-6 bg-rose-600 text-white rounded-lg font-semibold disabled:opacity-60 hover:bg-rose-700 transition-colors"
            >
              {submitting ? "Enviando..." : "Enviar solicitud"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
