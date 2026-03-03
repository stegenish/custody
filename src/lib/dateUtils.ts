import { getHolidaySet } from "./holidays";

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isHoliday: boolean;
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

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getISOWeekNumber(date: Date): number {
  // ISO 8601: week starts Monday, week 1 contains Jan 4th
  const d = startOfDay(date);
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1..Sun=7)
  const dayOfWeek = d.getDay() || 7; // Convert Sunday from 0 to 7
  d.setDate(d.getDate() + 4 - dayOfWeek);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
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
  holidays?: Set<string>
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
        isHoliday: holidays ? holidays.has(formatDateKey(cursor)) : false,
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
  return months.map(({ year, month }) =>
    generateMonthGrid(year, month, today, holidays)
  );
}
