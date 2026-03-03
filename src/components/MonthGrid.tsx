import type { CSSProperties } from "react";
import type { CalendarMonth } from "@/lib/dateUtils";
import type { DayColorResult } from "@/lib/scheduleTypes";
import { formatDateKey } from "@/lib/dateUtils";

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function cellStyle(dayColor?: DayColorResult): CSSProperties | undefined {
  if (!dayColor) return undefined;
  if (dayColor.outgoingLabel) {
    return {
      background: `linear-gradient(to bottom, ${dayColor.outgoingLabel.color} 50%, ${dayColor.label.color} 50%)`,
    };
  }
  return { backgroundColor: dayColor.label.color };
}

interface MonthGridProps {
  month: CalendarMonth;
  colorMap?: Map<string, DayColorResult>;
  onDayClick?: (dateKey: string) => void;
}

export function MonthGrid({ month, colorMap, onDayClick }: MonthGridProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <h2 className="mb-2 text-center text-sm font-semibold">
        {month.label} {month.year}
      </h2>
      <table className="w-full table-fixed text-xs">
        <thead>
          <tr>
            <th className="w-8 pb-1 text-center text-[10px] font-normal text-gray-400">
              Wk
            </th>
            {DAY_HEADERS.map((day) => (
              <th
                key={day}
                className="pb-1 text-center text-[10px] font-normal text-gray-500"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {month.weeks.map((week) => (
            <tr key={week.isoWeekNumber}>
              <td
                data-testid="week-number"
                className="text-center text-[10px] text-gray-400"
              >
                {week.isoWeekNumber}
              </td>
              {week.days.map((day, i) => {
                const isToday = day.isToday;
                const isOtherMonth = !day.isCurrentMonth;
                const dateKey = formatDateKey(day.date);
                const dayColor = colorMap?.get(dateKey);
                const clickable = dayColor && onDayClick;

                return (
                  <td
                    key={i}
                    data-testid={
                      isToday
                        ? "today"
                        : isOtherMonth
                          ? "day-other-month"
                          : "day-current-month"
                    }
                    role={clickable ? "button" : undefined}
                    onClick={
                      clickable
                        ? () => onDayClick(dateKey)
                        : undefined
                    }
                    style={cellStyle(dayColor)}
                    className={`text-center tabular-nums ${
                      clickable ? "cursor-pointer" : ""
                    } ${
                      isToday
                        ? "rounded-full ring-2 ring-blue-600 font-bold"
                        : isOtherMonth
                          ? "opacity-30"
                          : "text-gray-700"
                    }`}
                  >
                    {day.dayOfMonth}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
