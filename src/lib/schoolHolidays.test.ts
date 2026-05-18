import {
  BODO_SCHOOL_HOLIDAYS_LAST_KNOWN_DATE,
  BODO_SCHOOL_HOLIDAYS_SOURCE_CHECKED_AT,
  getBodoSchoolHolidaySet,
  getBodoSchoolHolidays,
} from "./schoolHolidays";

describe("getBodoSchoolHolidays", () => {
  it("documents the data freshness boundary", () => {
    expect(BODO_SCHOOL_HOLIDAYS_SOURCE_CHECKED_AT).toBe("2026-05-15");
    expect(BODO_SCHOOL_HOLIDAYS_LAST_KNOWN_DATE).toBe("2028-05-26");
  });

  it("includes known Bodo school breaks and student-free days", () => {
    const holidays = getBodoSchoolHolidays();
    expect(holidays).toContain("2026-03-02");
    expect(holidays).toContain("2026-03-06");
    expect(holidays).toContain("2026-05-15");
    expect(holidays).toContain("2026-09-28");
    expect(holidays).toContain("2026-10-02");
    expect(holidays).toContain("2027-02-22");
    expect(holidays).toContain("2027-02-26");
  });

  it("includes summer break between school years", () => {
    const holidays = getBodoSchoolHolidays();
    expect(holidays).toContain("2026-06-20");
    expect(holidays).toContain("2026-08-12");
    expect(holidays).not.toContain("2026-08-13");
  });
});

describe("getBodoSchoolHolidaySet", () => {
  it("filters school holidays to requested years", () => {
    const set = getBodoSchoolHolidaySet([2027]);
    expect(set.has("2027-02-22")).toBe(true);
    expect(set.has("2026-09-28")).toBe(false);
  });
});
