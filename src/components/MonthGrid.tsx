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

function custodyDescription(dayColor?: DayColorResult): string | null {
  if (!dayColor) return null;
  if (dayColor.outgoingLabel) {
    return `Changeover: ${dayColor.outgoingLabel.name} to ${dayColor.label.name}`;
  }
  return `Custody: ${dayColor.label.name}`;
}

function DayIndicators({
  dayColor,
  isSchoolHoliday,
  isChanged,
}: {
  dayColor?: DayColorResult;
  isSchoolHoliday: boolean;
  isChanged: boolean;
}) {
  const description = custodyDescription(dayColor);
  return (
    <>
      {description && <span className="sr-only">{description}</span>}
      {isSchoolHoliday && (
        <span
          data-testid="school-holiday-indicator"
          className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-sky-500"
        />
      )}
      {isChanged && (
        <span
          data-testid="proposal-change-indicator"
          className="absolute inset-0 rounded-sm ring-2 ring-inset ring-gray-900/40"
        />
      )}
    </>
  );
}

interface MonthGridProps {
  month: CalendarMonth;
  colorMap?: Map<string, DayColorResult>;
  changedDateKeys?: Set<string>;
  onDayClick?: (dateKey: string) => void;
}

export function MonthGrid({
  month,
  colorMap,
  changedDateKeys,
  onDayClick,
}: MonthGridProps) {
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
              {week.days.map((day) => {
                const isToday = day.isToday;
                const isOtherMonth = !day.isCurrentMonth;
                const dateKey = formatDateKey(day.date);
                const dayColor = colorMap?.get(dateKey);
                const clickable = Boolean(onDayClick);
                const isChanged = changedDateKeys?.has(dateKey) ?? false;

                return (
                  <td
                    key={dateKey}
                    data-testid={
                      isToday
                        ? "today"
                        : isOtherMonth
                          ? "day-other-month"
                          : "day-current-month"
                    }
                    style={cellStyle(dayColor)}
                    className={`relative text-center tabular-nums ${
                      clickable ? "cursor-pointer" : ""
                    } ${
                      isToday
                        ? `rounded-full ring-2 ring-blue-600 font-bold ${day.isHoliday ? "text-red-600" : ""}`
                        : isOtherMonth
                          ? "opacity-30"
                          : day.isHoliday
                            ? "text-red-600"
                            : "text-gray-700"
                    }`}
                  >
                    {clickable ? (
                      <button
                        type="button"
                        aria-label={dateKey}
                        onClick={() => onDayClick?.(dateKey)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onDayClick?.(dateKey);
                          }
                        }}
                        className="relative block h-full min-h-5 w-full rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                      >
                        {day.dayOfMonth}
                        <DayIndicators
                          dayColor={dayColor}
                          isSchoolHoliday={
                            day.isCurrentMonth && day.isSchoolHoliday
                          }
                          isChanged={day.isCurrentMonth && isChanged}
                        />
                      </button>
                    ) : (
                      <>
                        {day.dayOfMonth}
                        <DayIndicators
                          dayColor={dayColor}
                          isSchoolHoliday={
                            day.isCurrentMonth && day.isSchoolHoliday
                          }
                          isChanged={day.isCurrentMonth && isChanged}
                        />
                      </>
                    )}
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
