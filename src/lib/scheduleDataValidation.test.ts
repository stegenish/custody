import {
  MAX_SCHEDULE_DATA_LENGTH,
  MAX_TEXT_BODY_LENGTH,
  assertTextBodyLength,
  isScheduleData,
  parseScheduleDataJson,
} from "./scheduleDataValidation";

describe("isScheduleData", () => {
  it("accepts valid schedule data", () => {
    expect(
      isScheduleData({
        labels: [{ id: "mom", name: "Mom", color: "#bbf7d0" }],
        schedules: [
          {
            id: "schedule-1",
            startDate: "2026-03-02",
            cycleWeeks: 2,
            labelIds: ["mom", "dad"],
          },
        ],
        overrides: [{ date: "2026-03-03", labelId: "dad" }],
      })
    ).toBe(true);
  });

  it("rejects malformed nested schedule data", () => {
    expect(
      isScheduleData({
        labels: [{ id: "mom", name: "Mom", color: "#bbf7d0" }],
        schedules: [
          {
            id: "schedule-1",
            startDate: "not-a-date",
            cycleWeeks: 2,
            labelIds: ["mom", "dad"],
          },
        ],
        overrides: [],
      })
    ).toBe(false);

    expect(
      isScheduleData({
        labels: [],
        schedules: [
          {
            id: "schedule-1",
            startDate: "2026-03-02",
            cycleWeeks: 2,
            labelIds: ["mom"],
          },
        ],
        overrides: [],
      })
    ).toBe(false);

    expect(
      isScheduleData({
        labels: [],
        schedules: [],
        overrides: [{ date: "2026-02-31", labelId: "mom" }],
      })
    ).toBe(false);
  });
});

describe("parseScheduleDataJson", () => {
  it("parses valid schedule JSON", () => {
    expect(
      parseScheduleDataJson(
        JSON.stringify({ labels: [], schedules: [], overrides: [] })
      )
    ).toEqual({ labels: [], schedules: [], overrides: [] });
  });

  it("rejects invalid schedule JSON shape", () => {
    expect(() => parseScheduleDataJson("[]")).toThrow("Invalid schedule data");
  });

  it("rejects oversized schedule JSON", () => {
    expect(() =>
      parseScheduleDataJson(" ".repeat(MAX_SCHEDULE_DATA_LENGTH + 1))
    ).toThrow("Schedule data is too large");
  });
});

describe("assertTextBodyLength", () => {
  it("rejects oversized text bodies", () => {
    expect(() =>
      assertTextBodyLength("x".repeat(MAX_TEXT_BODY_LENGTH + 1), "Comment")
    ).toThrow("Comment is too long");
  });
});
