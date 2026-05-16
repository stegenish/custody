import {
  clearDraftScheduleData,
  createDefaultScheduleData,
  loadDraftScheduleData,
  loadScheduleData,
  saveDraftScheduleData,
  saveScheduleData,
} from "./storage";
import type { ScheduleData } from "./scheduleTypes";

beforeEach(() => {
  localStorage.clear();
});

describe("createDefaultScheduleData", () => {
  it("returns empty arrays for labels, schedules, and overrides", () => {
    const data = createDefaultScheduleData();
    expect(data).toEqual({ labels: [], schedules: [], overrides: [] });
  });
});

describe("loadScheduleData", () => {
  it("returns default data when localStorage is empty", () => {
    expect(loadScheduleData()).toEqual(createDefaultScheduleData());
  });

  it("returns default data when localStorage contains invalid JSON", () => {
    localStorage.setItem("custody-calendar-schedules", "not-json{{{");
    expect(loadScheduleData()).toEqual(createDefaultScheduleData());
  });

  it("returns default data when localStorage contains the wrong shape", () => {
    localStorage.setItem("custody-calendar-schedules", "{}");
    expect(loadScheduleData()).toEqual(createDefaultScheduleData());
  });

  it("returns default data when nested schedule data is malformed", () => {
    localStorage.setItem(
      "custody-calendar-schedules",
      JSON.stringify({
        labels: [],
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
    );

    expect(loadScheduleData()).toEqual(createDefaultScheduleData());
  });
});

describe("saveScheduleData + loadScheduleData", () => {
  it("round-trips correctly", () => {
    const data: ScheduleData = {
      labels: [{ id: "1", name: "Mom", color: "#bbf7d0" }],
      schedules: [
        {
          id: "s1",
          startDate: "2026-02-23",
          cycleWeeks: 2,
          labelIds: ["1", "2"],
        },
      ],
      overrides: [{ date: "2026-03-01", labelId: "1" }],
    };
    saveScheduleData(data);
    expect(loadScheduleData()).toEqual(data);
  });
});

describe("draft schedule storage", () => {
  const data: ScheduleData = {
    labels: [{ id: "1", name: "Mom", color: "#bbf7d0" }],
    schedules: [],
    overrides: [{ date: "2026-03-01", labelId: "1" }],
  };

  it("returns null when no draft exists", () => {
    expect(loadDraftScheduleData()).toBeNull();
  });

  it("returns null when draft storage contains the wrong shape", () => {
    localStorage.setItem("custody-calendar-draft-schedule", "{}");
    expect(loadDraftScheduleData()).toBeNull();
  });

  it("returns null when draft storage contains invalid JSON", () => {
    localStorage.setItem("custody-calendar-draft-schedule", "not-json{{{");
    expect(loadDraftScheduleData()).toBeNull();
  });

  it("returns null when nested draft schedule data is malformed", () => {
    localStorage.setItem(
      "custody-calendar-draft-schedule",
      JSON.stringify({
        labels: [],
        schedules: [],
        overrides: [{ date: "2026-02-31", labelId: "mom" }],
      })
    );

    expect(loadDraftScheduleData()).toBeNull();
  });

  it("round-trips a draft", () => {
    saveDraftScheduleData(data);
    expect(loadDraftScheduleData()).toEqual(data);
  });

  it("clears a draft", () => {
    saveDraftScheduleData(data);
    clearDraftScheduleData();
    expect(loadDraftScheduleData()).toBeNull();
  });
});
