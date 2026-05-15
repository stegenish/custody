import {
  computeEasterSunday,
  getNorwegianHolidays,
  getHolidaySet,
} from "./holidays";
import { formatDateKey } from "./dateUtils";

// --- computeEasterSunday ---

describe("computeEasterSunday", () => {
  it("returns March 31 for 2024", () => {
    const easter = computeEasterSunday(2024);
    expect(easter.getFullYear()).toBe(2024);
    expect(easter.getMonth()).toBe(2); // March
    expect(easter.getDate()).toBe(31);
  });

  it("returns April 20 for 2025", () => {
    const easter = computeEasterSunday(2025);
    expect(easter.getFullYear()).toBe(2025);
    expect(easter.getMonth()).toBe(3); // April
    expect(easter.getDate()).toBe(20);
  });

  it("returns April 5 for 2026", () => {
    const easter = computeEasterSunday(2026);
    expect(easter.getFullYear()).toBe(2026);
    expect(easter.getMonth()).toBe(3); // April
    expect(easter.getDate()).toBe(5);
  });

  it("returns March 28 for 2027", () => {
    const easter = computeEasterSunday(2027);
    expect(easter.getFullYear()).toBe(2027);
    expect(easter.getMonth()).toBe(2); // March
    expect(easter.getDate()).toBe(28);
  });
});

// --- getNorwegianHolidays ---

describe("getNorwegianHolidays", () => {
  const holidays2026 = getNorwegianHolidays(2026);
  const keys2026 = holidays2026.map(formatDateKey);

  it("includes fixed holidays", () => {
    expect(keys2026).toContain("2026-01-01"); // New Year's Day
    expect(keys2026).toContain("2026-05-01"); // Labour Day
    expect(keys2026).toContain("2026-05-17"); // Constitution Day
    expect(keys2026).toContain("2026-12-25"); // Christmas Day
    expect(keys2026).toContain("2026-12-26"); // Boxing Day
  });

  it("includes all 7 Easter-based holidays for 2026 (Easter = Apr 5)", () => {
    expect(keys2026).toContain("2026-04-02"); // Maundy Thursday (-3)
    expect(keys2026).toContain("2026-04-03"); // Good Friday (-2)
    expect(keys2026).toContain("2026-04-05"); // Easter Sunday (0)
    expect(keys2026).toContain("2026-04-06"); // Easter Monday (+1)
    expect(keys2026).toContain("2026-05-14"); // Ascension Day (+39)
    expect(keys2026).toContain("2026-05-24"); // Whit Sunday (+49)
    expect(keys2026).toContain("2026-05-25"); // Whit Monday (+50)
  });

  it("includes all Sundays in 2026", () => {
    const sundayKeys = new Set(
      holidays2026.filter((d) => d.getDay() === 0).map(formatDateKey)
    );
    expect(sundayKeys.size).toBe(52);
  });

  it("does not include a regular weekday", () => {
    // March 3, 2026 is a Tuesday
    expect(keys2026).not.toContain("2026-03-03");
  });

  it("does not duplicate fixed holidays that fall on Sundays", () => {
    const uniqueKeys = new Set(keys2026);
    expect(uniqueKeys.size).toBe(keys2026.length);
  });
});

// --- getHolidaySet ---

describe("getHolidaySet", () => {
  it("returns a Set of date keys", () => {
    const set = getHolidaySet([2026]);
    expect(set).toBeInstanceOf(Set);
    expect(set.has("2026-01-01")).toBe(true);
  });

  it("spans multiple years", () => {
    const set = getHolidaySet([2025, 2026]);
    expect(set.has("2025-01-01")).toBe(true);
    expect(set.has("2026-01-01")).toBe(true);
    expect(set.has("2025-12-25")).toBe(true);
    expect(set.has("2026-12-25")).toBe(true);
  });

  it("includes Sundays from all requested years", () => {
    const set = getHolidaySet([2025, 2026]);
    // Jan 5, 2025 is a Sunday
    expect(set.has("2025-01-05")).toBe(true);
    // Jan 4, 2026 is a Sunday
    expect(set.has("2026-01-04")).toBe(true);
  });
});
