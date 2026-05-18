import type { CSSProperties } from "react";
import type { CalendarDay, CalendarMonth } from "@/lib/dateUtils";
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

function dateStatusDescriptions({
  dayColor,
  isSchoolHoliday,
  isChanged,
  hasSharedNote,
  hasProposalComment,
}: {
  dayColor?: DayColorResult;
  isSchoolHoliday: boolean;
  isChanged: boolean;
  hasSharedNote: boolean;
  hasProposalComment: boolean;
}): string[] {
  return [
    custodyDescription(dayColor),
    isSchoolHoliday ? "School holiday" : null,
    isChanged ? "Proposal changes this date" : null,
    hasSharedNote ? "Has shared note" : null,
    hasProposalComment ? "Has proposal comment" : null,
  ].filter((description): description is string => Boolean(description));
}

function DayIndicators({
  dayColor,
  isSchoolHoliday,
  isChanged,
  hasSharedNote,
  hasProposalComment,
}: {
  dayColor?: DayColorResult;
  isSchoolHoliday: boolean;
  isChanged: boolean;
  hasSharedNote: boolean;
  hasProposalComment: boolean;
}) {
  const descriptions = dateStatusDescriptions({
    dayColor,
    isSchoolHoliday,
    isChanged,
    hasSharedNote,
    hasProposalComment,
  });
  return (
    <>
      {descriptions.map((description) => (
        <span key={description} className="sr-only">
          {description}
        </span>
      ))}
      {hasSharedNote && (
        <span
          aria-hidden="true"
          data-testid="shared-note-indicator"
          className="absolute bottom-0.5 left-1 h-1.5 w-1.5 rounded-full bg-violet-600"
        />
      )}
      {hasProposalComment && (
        <span
          aria-hidden="true"
          data-testid="proposal-comment-indicator"
          className="absolute bottom-0.5 right-1 h-1.5 w-1.5 rounded-full bg-amber-500"
        />
      )}
      {isChanged && (
        <span
          aria-hidden="true"
          data-testid="proposal-change-indicator"
          className="absolute inset-0 rounded-sm ring-2 ring-inset ring-gray-900/40"
        />
      )}
    </>
  );
}

function dayCellTestId(day: CalendarDay): string {
  if (day.isToday) return "today";
  return day.isCurrentMonth ? "day-current-month" : "day-other-month";
}

function dayCellClassName(
  day: CalendarDay,
  clickable: boolean
): string {
  const dayTextClass = day.isRedDay
    ? "text-red-600"
    : day.isSchoolHoliday
      ? "text-sky-600"
      : "text-gray-700";
  const dateClass = day.isToday
    ? `rounded-full ring-2 ring-blue-600 font-bold ${dayTextClass}`
    : !day.isCurrentMonth
      ? "opacity-30"
      : dayTextClass;
  return `relative text-center tabular-nums ${
    clickable ? "cursor-pointer" : ""
  } ${dateClass}`;
}

function DayCell({
  day,
  dayColor,
  isChanged,
  hasSharedNote,
  hasProposalComment,
  onDayClick,
}: {
  day: CalendarDay;
  dayColor?: DayColorResult;
  isChanged: boolean;
  hasSharedNote: boolean;
  hasProposalComment: boolean;
  onDayClick?: (dateKey: string) => void;
}) {
  const dateKey = formatDateKey(day.date);
  const clickable = Boolean(onDayClick);
  const isSchoolHoliday = day.isCurrentMonth && day.isSchoolHoliday;
  const isCurrentMonthChanged = day.isCurrentMonth && isChanged;
  const hasCurrentMonthSharedNote = day.isCurrentMonth && hasSharedNote;
  const hasCurrentMonthProposalComment =
    day.isCurrentMonth && hasProposalComment;
  const accessibleName = [
    dateKey,
    ...dateStatusDescriptions({
      dayColor,
      isSchoolHoliday,
      isChanged: isCurrentMonthChanged,
      hasSharedNote: hasCurrentMonthSharedNote,
      hasProposalComment: hasCurrentMonthProposalComment,
    }),
  ].join(". ");
  const indicators = (
    <DayIndicators
      dayColor={dayColor}
      isSchoolHoliday={isSchoolHoliday}
      isChanged={isCurrentMonthChanged}
      hasSharedNote={hasCurrentMonthSharedNote}
      hasProposalComment={hasCurrentMonthProposalComment}
    />
  );

  return (
    <td
      data-testid={dayCellTestId(day)}
      style={cellStyle(dayColor)}
      className={dayCellClassName(day, clickable)}
    >
      {clickable ? (
        <button
          type="button"
          aria-label={accessibleName}
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
          {indicators}
        </button>
      ) : (
        <>
          {day.dayOfMonth}
          {indicators}
        </>
      )}
    </td>
  );
}

interface MonthGridProps {
  month: CalendarMonth;
  colorMap?: Map<string, DayColorResult>;
  changedDateKeys?: Set<string>;
  noteDateKeys?: Set<string>;
  commentDateKeys?: Set<string>;
  onDayClick?: (dateKey: string) => void;
}

export function MonthGrid({
  month,
  colorMap,
  changedDateKeys,
  noteDateKeys,
  commentDateKeys,
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
                const dateKey = formatDateKey(day.date);
                return (
                  <DayCell
                    key={dateKey}
                    day={day}
                    dayColor={colorMap?.get(dateKey)}
                    isChanged={changedDateKeys?.has(dateKey) ?? false}
                    hasSharedNote={noteDateKeys?.has(dateKey) ?? false}
                    hasProposalComment={commentDateKeys?.has(dateKey) ?? false}
                    onDayClick={onDayClick}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
