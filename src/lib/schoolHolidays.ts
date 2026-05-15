interface DateRange {
  start: string;
  end: string;
}

const BODO_SCHOOL_HOLIDAY_RANGES: DateRange[] = [
  { start: "2025-09-29", end: "2025-10-03" },
  { start: "2025-11-21", end: "2025-11-21" },
  { start: "2025-12-20", end: "2026-01-04" },
  { start: "2026-03-02", end: "2026-03-06" },
  { start: "2026-03-30", end: "2026-04-07" },
  { start: "2026-05-15", end: "2026-05-15" },
  { start: "2026-06-20", end: "2026-08-12" },
  { start: "2026-09-28", end: "2026-10-02" },
  { start: "2026-11-20", end: "2026-11-20" },
  { start: "2026-12-19", end: "2027-01-03" },
  { start: "2027-02-22", end: "2027-02-26" },
  { start: "2027-03-22", end: "2027-03-30" },
  { start: "2027-05-07", end: "2027-05-07" },
  { start: "2027-06-18", end: "2027-08-18" },
  { start: "2027-10-11", end: "2027-10-15" },
  { start: "2027-11-19", end: "2027-11-19" },
  { start: "2027-12-22", end: "2028-01-02" },
  { start: "2028-03-06", end: "2028-03-10" },
  { start: "2028-04-10", end: "2028-04-18" },
  { start: "2028-05-26", end: "2028-05-26" },
];

function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function expandRange(range: DateRange): string[] {
  const dates: string[] = [];
  const cursor = parseDateKey(range.start);
  const end = parseDateKey(range.end);

  while (cursor <= end) {
    dates.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function getBodoSchoolHolidays(): string[] {
  return BODO_SCHOOL_HOLIDAY_RANGES.flatMap(expandRange);
}

export function getBodoSchoolHolidaySet(years: number[]): Set<string> {
  const yearSet = new Set(years);
  return new Set(
    getBodoSchoolHolidays().filter((dateKey) =>
      yearSet.has(Number(dateKey.slice(0, 4)))
    )
  );
}
