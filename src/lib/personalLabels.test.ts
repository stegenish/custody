import {
  applyLabelPreferences,
  parsePersonalLabelPreferences,
} from "./personalLabels";
import type { ScheduleData } from "./scheduleTypes";

const scheduleData: ScheduleData = {
  labels: [
    { id: "mom", name: "Mom", color: "#bbf7d0" },
    { id: "dad", name: "Dad", color: "#fef08a" },
  ],
  schedules: [
    {
      id: "schedule-1",
      startDate: "2026-03-02",
      cycleWeeks: 1,
      labelIds: ["mom", "dad"],
    },
  ],
  overrides: [{ date: "2026-03-03", labelId: "dad" }],
};

describe("applyLabelPreferences", () => {
  it("overlays personal label names and colors without changing schedule structure", () => {
    const result = applyLabelPreferences(scheduleData, {
      mom: { name: "Thomas", color: "#123456" },
    });

    expect(result.labels[0]).toEqual({
      id: "mom",
      name: "Thomas",
      color: "#123456",
    });
    expect(result.labels[1]).toEqual(scheduleData.labels[1]);
    expect(result.schedules).toBe(scheduleData.schedules);
    expect(result.overrides).toBe(scheduleData.overrides);
  });
});

describe("parsePersonalLabelPreferences", () => {
  it("keeps valid personal label preferences", () => {
    expect(
      parsePersonalLabelPreferences({
        mom: { name: "Thomas", color: "#123456" },
      })
    ).toEqual({ mom: { name: "Thomas", color: "#123456" } });
  });

  it("drops malformed or unsafe personal label preferences", () => {
    expect(
      parsePersonalLabelPreferences({
        mom: { id: "changed", name: "Thomas", color: "#123456" },
        dad: { name: "Dad", color: "url(/bad)" },
        other: null,
      })
    ).toEqual({});
  });
});
