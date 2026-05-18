import { getHolidaySet } from "./holidays";
import { getBodoSchoolHolidaySet } from "./schoolHolidays";
export { formatDateKey, parseDateKey } from "./dateKeys";
import { formatDateKey } from "./dateKeys";

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isRedDay: boolean;
  isSchoolHoliday: boolean;
}

export interface CalendarWeek {
  isoWeekNumber: number;
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  label: string;
  weeks: CalendarWeek[];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getISOWeekNumber(date: Date): number {
  // ISO 8601: week starts Monday, week 1 contains Jan 4th
  const d = startOfDay(date);
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1..Sun=7)
  const dayOfWeek = d.getDay() || 7; // Convert Sunday from 0 to 7
  d.setDate(d.getDate() + 4 - dayOfWeek);
  const dateUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const yearStartUtc = Date.UTC(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((dateUtc - yearStartUtc) / 86400000 + 1) / 7
  );
  return weekNumber;
}

export function getMonthRange(
  today: Date
): { year: number; month: number }[] {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const range: { year: number; month: number }[] = [];

  for (let offset = -3; offset <= 11; offset++) {
    const totalMonths = currentYear * 12 + currentMonth + offset;
    const year = Math.floor(totalMonths / 12);
    const month = totalMonths % 12;
    range.push({ year, month });
  }

  return range;
}

export function getMondayBefore(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay() || 7; // Convert Sunday from 0 to 7
  d.setDate(d.getDate() - (day - 1));
  return d;
}

export function generateMonthGrid(
  year: number,
  month: number,
  today: Date,
  holidays?: Set<string>,
  schoolHolidays?: Set<string>
): CalendarMonth {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Start from the Monday on or before the 1st
  const gridStart = getMondayBefore(firstOfMonth);

  // End on the Sunday on or after the last day
  const lastDay = lastOfMonth.getDay() || 7;
  const gridEnd = new Date(
    lastOfMonth.getFullYear(),
    lastOfMonth.getMonth(),
    lastOfMonth.getDate() + (7 - lastDay)
  );

  const weeks: CalendarWeek[] = [];
  const cursor = new Date(gridStart);

  while (cursor <= gridEnd) {
    const days: CalendarDay[] = [];
    const weekMonday = new Date(cursor);

    for (let i = 0; i < 7; i++) {
      days.push({
        date: new Date(cursor),
        dayOfMonth: cursor.getDate(),
        isToday: isSameDay(cursor, today),
        isCurrentMonth: cursor.getMonth() === month,
        isRedDay: holidays ? holidays.has(formatDateKey(cursor)) : false,
        isSchoolHoliday: schoolHolidays
          ? schoolHolidays.has(formatDateKey(cursor))
          : false,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push({
      isoWeekNumber: getISOWeekNumber(weekMonday),
      days,
    });
  }

  return {
    year,
    month,
    label: MONTH_NAMES[month],
    weeks,
  };
}

export function generateCalendar(today: Date): CalendarMonth[] {
  const months = getMonthRange(today);
  const years = [...new Set(months.map((m) => m.year))];
  const holidays = getHolidaySet(years);
  const schoolHolidays = getBodoSchoolHolidaySet(years);
  return months.map(({ year, month }) =>
    generateMonthGrid(year, month, today, holidays, schoolHolidays)
  );
}

export function getCalendarVisibleRange(calendar: CalendarMonth[]): {
  firstDay: Date;
  lastDay: Date;
} {
  if (calendar.length === 0) {
    throw new Error("Calendar must contain at least one month");
  }
  const firstDay = calendar[0].weeks[0].days[0].date;
  const lastMonth = calendar[calendar.length - 1];
  const lastWeek = lastMonth.weeks[lastMonth.weeks.length - 1];
  const lastDay = lastWeek.days[lastWeek.days.length - 1].date;
  return { firstDay, lastDay };
}
