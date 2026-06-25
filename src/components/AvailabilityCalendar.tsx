import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import "react-day-picker/style.css";

interface BusyPeriod {
  start: string;
  end: string;
}

interface Props {
  onDateSelect: (date: Date | undefined) => void;
  selectedDate: Date | undefined;
}

export default function AvailabilityCalendar({ onDateSelect, selectedDate }: Props) {
  const [busyPeriods, setBusyPeriods] = useState<BusyPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    fetch("/api/availability")
      .then((r) => r.json())
      .then((data: { busy: BusyPeriod[]; mock?: boolean }) => {
        setBusyPeriods(data.busy ?? []);
        setIsMock(data.mock ?? false);
      })
      .catch(() => setBusyPeriods([]))
      .finally(() => setLoading(false));
  }, []);

  const disabledDays = [
    { before: new Date() },
    ...busyPeriods.map((p) => ({
      from: new Date(p.start),
      to: new Date(p.end),
    })),
  ];

  return (
    <div className="flex flex-col items-center">
      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Cargando disponibilidad...
        </div>
      ) : (
        <>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            disabled={disabledDays}
            locale={es}
            numberOfMonths={1}
            showOutsideDays={false}
            classNames={{
              today: "font-bold text-rose-600",
              selected: "bg-rose-600 text-white rounded-full",
              disabled: "opacity-30 line-through cursor-not-allowed",
            }}
          />
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" />
              Fecha seleccionada
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
              Ocupado
            </span>
          </div>
          {isMock && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              Disponibilidad de ejemplo — se actualizará con Google Calendar
            </p>
          )}
        </>
      )}
    </div>
  );
}
