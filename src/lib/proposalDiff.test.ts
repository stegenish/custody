import { getChangedDateKeys } from "./proposalDiff";
import type { ScheduleData } from "./scheduleTypes";

const labels = [
  { id: "mom", name: "Mom", color: "#bbf7d0" },
  { id: "dad", name: "Dad", color: "#fef08a" },
];

function scheduleData(overrides: ScheduleData["overrides"]): ScheduleData {
  return {
    labels,
    schedules: [
      {
        id: "schedule-1",
        startDate: "2026-06-01",
        cycleWeeks: 1,
        labelIds: ["mom", "dad"],
      },
    ],
    overrides,
  };
}

describe("getChangedDateKeys", () => {
  it("returns dates where resolved labels differ", () => {
    const agreed = scheduleData([]);
    const proposed = scheduleData([{ date: "2026-06-02", labelId: "dad" }]);

    expect(
      getChangedDateKeys(
        new Date(2026, 5, 1),
        new Date(2026, 5, 7),
        agreed,
        proposed
      )
    ).toEqual(["2026-06-02"]);
  });

  it("returns dates where override status changes even if label is the same", () => {
    const agreed = scheduleData([]);
    const proposed = scheduleData([{ date: "2026-06-02", labelId: "mom" }]);

    expect(
      getChangedDateKeys(
        new Date(2026, 5, 1),
        new Date(2026, 5, 7),
        agreed,
        proposed
      )
    ).toEqual(["2026-06-02"]);
  });

  it("returns dates affected by schedule rule changes within the visible range", () => {
    const agreed = scheduleData([]);
    const proposed: ScheduleData = {
      ...agreed,
      schedules: [
        {
          id: "schedule-1",
          startDate: "2026-06-01",
          cycleWeeks: 2,
          labelIds: ["mom", "dad"],
        },
      ],
    };

    expect(
      getChangedDateKeys(
        new Date(2026, 5, 1),
        new Date(2026, 5, 21),
        agreed,
        proposed
      )
    ).toEqual([
      "2026-06-08",
      "2026-06-09",
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
      "2026-06-13",
      "2026-06-14",
      "2026-06-15",
      "2026-06-16",
      "2026-06-17",
      "2026-06-18",
      "2026-06-19",
      "2026-06-20",
      "2026-06-21",
    ]);
  });

  it("ignores changes outside the requested range", () => {
    const agreed = scheduleData([]);
    const proposed = scheduleData([{ date: "2026-06-10", labelId: "dad" }]);

    expect(
      getChangedDateKeys(
        new Date(2026, 5, 1),
        new Date(2026, 5, 7),
        agreed,
        proposed
      )
    ).toEqual([]);
  });
});
