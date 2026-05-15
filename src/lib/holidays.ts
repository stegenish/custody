import { formatDateKey } from "./dateUtils";

/** Anonymous Gregorian algorithm for Easter Sunday */
export function computeEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** All Norwegian public holidays + Sundays for a given year */
export function getNorwegianHolidays(year: number): Date[] {
  const dates: Date[] = [];

  // Fixed holidays
  dates.push(new Date(year, 0, 1));   // New Year's Day
  dates.push(new Date(year, 4, 1));   // Labour Day
  dates.push(new Date(year, 4, 17));  // Constitution Day
  dates.push(new Date(year, 11, 25)); // Christmas Day
  dates.push(new Date(year, 11, 26)); // Boxing Day

  // Easter-based moveable holidays
  const easter = computeEasterSunday(year);
  const offsets = [-3, -2, 0, 1, 39, 49, 50];
  for (const offset of offsets) {
    dates.push(addDays(easter, offset));
  }

  // All Sundays in the year
  const cursor = new Date(year, 0, 1);
  // Advance to first Sunday
  while (cursor.getDay() !== 0) {
    cursor.setDate(cursor.getDate() + 1);
  }
  while (cursor.getFullYear() === year) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  return Array.from(
    new Map(dates.map((date) => [formatDateKey(date), date])).values()
  );
}

/** Union of holiday date keys for multiple years */
export function getHolidaySet(years: number[]): Set<string> {
  const set = new Set<string>();
  for (const year of years) {
    for (const date of getNorwegianHolidays(year)) {
      set.add(formatDateKey(date));
    }
  }
  return set;
}
