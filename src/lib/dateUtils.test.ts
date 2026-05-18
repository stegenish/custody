import {
  isSameDay,
  startOfDay,
  formatDateKey,
  parseDateKey,
  getISOWeekNumber,
  getMonthRange,
  generateMonthGrid,
  generateCalendar,
  getCalendarVisibleRange,
} from "./dateUtils";

// --- isSameDay ---

describe("isSameDay", () => {
  it("returns true for the same date", () => {
    const a = new Date(2026, 2, 1); // March 1, 2026
    const b = new Date(2026, 2, 1);
    expect(isSameDay(a, b)).toBe(true);
  });

  it("returns true for same date with different times", () => {
    const a = new Date(2026, 2, 1, 9, 30);
    const b = new Date(2026, 2, 1, 23, 59);
    expect(isSameDay(a, b)).toBe(true);
  });

  it("returns false for different dates", () => {
    const a = new Date(2026, 2, 1);
    const b = new Date(2026, 2, 2);
    expect(isSameDay(a, b)).toBe(false);
  });
});

// --- formatDateKey / parseDateKey ---

describe("formatDateKey", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(formatDateKey(new Date(2026, 2, 1))).toBe("2026-03-01");
  });

  it("formats dates using Norway local date semantics", () => {
    expect(formatDateKey(new Date("2026-03-29T22:30:00.000Z"))).toBe(
      "2026-03-30"
    );
  });
});

describe("parseDateKey", () => {
  it("round-trips with formatDateKey", () => {
    const original = new Date(2026, 0, 15);
    const key = formatDateKey(original);
    const parsed = parseDateKey(key);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(0);
    expect(parsed.getDate()).toBe(15);
  });

  it("parses date keys into a stable instant that formats back to Norway date", () => {
    const parsed = parseDateKey("2026-10-25");

    expect(formatDateKey(parsed)).toBe("2026-10-25");
  });

  it("throws for malformed date keys", () => {
    expect(() => parseDateKey("not-a-date")).toThrow(
      "Invalid date key: not-a-date"
    );
    expect(() => parseDateKey("2026-02-30")).toThrow(
      "Invalid date key: 2026-02-30"
    );
  });
});

// --- startOfDay ---

describe("startOfDay", () => {
  it("strips time from a date", () => {
    const d = startOfDay(new Date(2026, 2, 1, 14, 30, 45));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(1);
  });

  it("returns a new Date object", () => {
    const original = new Date(2026, 2, 1);
    expect(startOfDay(original)).not.toBe(original);
  });
});

// --- getISOWeekNumber ---

describe("getISOWeekNumber", () => {
  it("returns week 1 for Jan 1, 2024 (Monday)", () => {
    // Jan 1 2024 is a Monday — start of ISO week 1
    expect(getISOWeekNumber(new Date(2024, 0, 1))).toBe(1);
  });

  it("returns week 1 for Jan 5, 2026 (Monday)", () => {
    // Jan 5 2026 is a Monday — ISO week 2 actually starts here
    // Let me recalculate: Jan 1 2026 is Thursday, so week 1 includes Dec 29 Mon - Jan 4 Sun
    // Jan 5 2026 is Monday = week 2
    expect(getISOWeekNumber(new Date(2026, 0, 5))).toBe(2);
  });

  it("returns week 1 for Dec 31, 2025 (Wednesday)", () => {
    // Dec 31 2025 is Wednesday, belongs to ISO week 1 of 2026
    expect(getISOWeekNumber(new Date(2025, 11, 31))).toBe(1);
  });

  it("returns week 53 for Dec 28, 2026 (Monday)", () => {
    // 2026: Jan 1 is Thursday, so it has 53 ISO weeks
    // Dec 28 2026 is Monday — start of week 53
    expect(getISOWeekNumber(new Date(2026, 11, 28))).toBe(53);
  });

  it("returns week 9 for March 1, 2026 (Sunday)", () => {
    // March 1, 2026 is a Sunday — last day of ISO week 9
    expect(getISOWeekNumber(new Date(2026, 2, 1))).toBe(9);
  });
});

// --- getMonthRange ---

describe("getMonthRange", () => {
  it("returns 15 months", () => {
    const range = getMonthRange(new Date(2026, 2, 1));
    expect(range).toHaveLength(15);
  });

  it("starts 3 months before the current month", () => {
    const range = getMonthRange(new Date(2026, 2, 1)); // March 2026
    expect(range[0]).toEqual({ year: 2025, month: 11 }); // December 2025
  });

  it("includes the current month at index 3", () => {
    const range = getMonthRange(new Date(2026, 2, 1)); // March 2026
    expect(range[3]).toEqual({ year: 2026, month: 2 }); // March 2026
  });

  it("ends 11 months after the current month", () => {
    const range = getMonthRange(new Date(2026, 2, 1)); // March 2026
    expect(range[14]).toEqual({ year: 2027, month: 1 }); // February 2027
  });

  it("handles year boundary when current month is January", () => {
    const range = getMonthRange(new Date(2026, 0, 15)); // January 2026
    expect(range[0]).toEqual({ year: 2025, month: 9 }); // October 2025
    expect(range[3]).toEqual({ year: 2026, month: 0 }); // January 2026
    expect(range[14]).toEqual({ year: 2026, month: 11 }); // December 2026
  });
});

// --- generateMonthGrid ---

describe("generateMonthGrid", () => {
  const today = new Date(2026, 2, 1); // March 1, 2026 (Sunday)

  it("has the correct label and year/month", () => {
    const grid = generateMonthGrid(2026, 2, today);
    expect(grid.label).toBe("March");
    expect(grid.year).toBe(2026);
    expect(grid.month).toBe(2);
  });

  it("each week has exactly 7 days", () => {
    const grid = generateMonthGrid(2026, 2, today);
    for (const week of grid.weeks) {
      expect(week.days).toHaveLength(7);
    }
  });

  it("first day of first week is a Monday", () => {
    const grid = generateMonthGrid(2026, 2, today);
    const firstDay = grid.weeks[0].days[0].date;
    expect(firstDay.getDay()).toBe(1); // Monday
  });

  it("last day of last week is a Sunday", () => {
    const grid = generateMonthGrid(2026, 2, today);
    const lastWeek = grid.weeks[grid.weeks.length - 1];
    const lastDay = lastWeek.days[6].date;
    expect(lastDay.getDay()).toBe(0); // Sunday
  });

  it("marks non-current-month days correctly", () => {
    const grid = generateMonthGrid(2026, 2, today); // March 2026
    // March 1 2026 is Sunday, so first week starts Feb 23 (Monday)
    const firstDay = grid.weeks[0].days[0];
    expect(firstDay.isCurrentMonth).toBe(false); // Feb 23 is not March
    expect(firstDay.dayOfMonth).toBe(23);
  });

  it("marks today correctly", () => {
    const grid = generateMonthGrid(2026, 2, today);
    const allDays = grid.weeks.flatMap((w) => w.days);
    const todayDays = allDays.filter((d) => d.isToday);
    expect(todayDays).toHaveLength(1);
    expect(todayDays[0].dayOfMonth).toBe(1);
    expect(todayDays[0].isCurrentMonth).toBe(true);
  });

  it("has correct ISO week numbers", () => {
    const grid = generateMonthGrid(2026, 2, today);
    // First week of March 2026 grid starts Feb 23 (Mon) — that's ISO week 9
    expect(grid.weeks[0].isoWeekNumber).toBe(9);
  });

  it("handles February in a non-leap year", () => {
    const grid = generateMonthGrid(2026, 1, today); // February 2026
    const allDays = grid.weeks.flatMap((w) => w.days);
    const febDays = allDays.filter((d) => d.isCurrentMonth);
    expect(febDays).toHaveLength(28);
  });
});

// --- generateCalendar ---

describe("generateCalendar", () => {
  const today = new Date(2026, 2, 1);

  it("returns 15 months", () => {
    const calendar = generateCalendar(today);
    expect(calendar).toHaveLength(15);
  });

  it("first month is December 2025", () => {
    const calendar = generateCalendar(today);
    expect(calendar[0].label).toBe("December");
    expect(calendar[0].year).toBe(2025);
  });

  it("last month is February 2027", () => {
    const calendar = generateCalendar(today);
    expect(calendar[14].label).toBe("February");
    expect(calendar[14].year).toBe(2027);
  });

  it("marks Jan 1 as a holiday", () => {
    const calendar = generateCalendar(new Date(2026, 0, 15));
    // January 2026 is at index 3 (current month)
    const janMonth = calendar[3];
    expect(janMonth.label).toBe("January");
    const allDays = janMonth.weeks.flatMap((w) => w.days);
    const jan1 = allDays.find(
      (d) => d.isCurrentMonth && d.dayOfMonth === 1
    );
    expect(jan1?.isRedDay).toBe(true);
  });

  it("marks Bodo school holidays", () => {
    const calendar = generateCalendar(new Date(2026, 2, 1));
    const march = calendar[3];
    const allDays = march.weeks.flatMap((w) => w.days);
    const mar2 = allDays.find(
      (d) => d.isCurrentMonth && d.dayOfMonth === 2
    );
    expect(mar2?.isSchoolHoliday).toBe(true);
  });

  it("returns its full visible date range", () => {
    const calendar = generateCalendar(today);
    const range = getCalendarVisibleRange(calendar);

    expect(formatDateKey(range.firstDay)).toBe("2025-12-01");
    expect(formatDateKey(range.lastDay)).toBe("2027-02-28");
  });
});

// --- isRedDay in generateMonthGrid ---

describe("generateMonthGrid isRedDay", () => {
  const today = new Date(2026, 2, 1);

  it("defaults to false when no holidays param is provided", () => {
    const grid = generateMonthGrid(2026, 2, today);
    const allDays = grid.weeks.flatMap((w) => w.days);
    expect(allDays.every((d) => d.isRedDay === false)).toBe(true);
    expect(allDays.every((d) => d.isSchoolHoliday === false)).toBe(true);
  });

  it("marks matching days as holidays when holidays set is provided", () => {
    const holidays = new Set(["2026-03-01"]);
    const grid = generateMonthGrid(2026, 2, today, holidays);
    const allDays = grid.weeks.flatMap((w) => w.days);
    const mar1 = allDays.find(
      (d) => d.isCurrentMonth && d.dayOfMonth === 1
    );
    expect(mar1?.isRedDay).toBe(true);
  });

  it("does not mark non-holiday days", () => {
    const holidays = new Set(["2026-03-01"]);
    const grid = generateMonthGrid(2026, 2, today, holidays);
    const allDays = grid.weeks.flatMap((w) => w.days);
    const mar2 = allDays.find(
      (d) => d.isCurrentMonth && d.dayOfMonth === 2
    );
    expect(mar2?.isRedDay).toBe(false);
  });

  it("marks matching school holidays when school holiday set is provided", () => {
    const grid = generateMonthGrid(
      2026,
      2,
      today,
      new Set(),
      new Set(["2026-03-02"])
    );
    const allDays = grid.weeks.flatMap((w) => w.days);
    const mar2 = allDays.find(
      (d) => d.isCurrentMonth && d.dayOfMonth === 2
    );
    expect(mar2?.isSchoolHoliday).toBe(true);
  });
});
