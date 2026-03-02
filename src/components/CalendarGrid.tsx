import type { CalendarMonth } from "@/lib/dateUtils";
import type { DayColorResult } from "@/lib/scheduleTypes";
import { MonthGrid } from "./MonthGrid";

interface CalendarGridProps {
  months: CalendarMonth[];
  colorMap?: Map<string, DayColorResult>;
  onDayClick?: (dateKey: string) => void;
}

export function CalendarGrid({ months, colorMap, onDayClick }: CalendarGridProps) {
  return (
    <div
      data-testid="calendar-grid"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {months.map((month) => (
        <MonthGrid
          key={`${month.year}-${month.month}`}
          month={month}
          colorMap={colorMap}
          onDayClick={onDayClick}
        />
      ))}
    </div>
  );
}
