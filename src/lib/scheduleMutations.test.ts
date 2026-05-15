import {
  validateLabel,
  validateSchedule,
  addLabel,
  updateLabel,
  deleteLabel,
  addSchedule,
  deleteSchedule,
  setDayOverride,
  removeDayOverride,
} from "./scheduleMutations";
import type { ScheduleData } from "./scheduleTypes";

function emptyData(): ScheduleData {
  return { labels: [], schedules: [], overrides: [] };
}

describe("validateLabel", () => {
  it("returns error for empty name", () => {
    expect(validateLabel("", "#bbf7d0")).toBe("Label name is required");
  });

  it("returns error for empty color", () => {
    expect(validateLabel("Mom", "")).toBe("Color is required");
  });

  it("returns null for valid inputs", () => {
    expect(validateLabel("Mom", "#bbf7d0")).toBeNull();
  });
});

describe("validateSchedule", () => {
  const labels = [
    { id: "a", name: "Mom", color: "#bbf7d0" },
    { id: "b", name: "Dad", color: "#fef08a" },
  ];

  it("returns error when label IDs are not found", () => {
    expect(validateSchedule("2026-03-02", 2, ["x", "y"], labels)).toBe(
      "Both labels must exist"
    );
  });

  it("returns error when label IDs are identical", () => {
    expect(validateSchedule("2026-03-02", 2, ["a", "a"], labels)).toBe(
      "Labels must be different"
    );
  });

  it("returns error when start date is invalid", () => {
    expect(validateSchedule("not-a-date", 2, ["a", "b"], labels)).toBe(
      "Start date must be a valid YYYY-MM-DD date"
    );
  });

  it("returns error when cycle weeks is invalid", () => {
    expect(validateSchedule("2026-03-02", 4, ["a", "b"], labels)).toBe(
      "Cycle must be 1, 2, or 3 weeks"
    );
  });

  it("returns null for valid inputs", () => {
    expect(validateSchedule("2026-03-02", 2, ["a", "b"], labels)).toBeNull();
  });
});

describe("addLabel", () => {
  it("appends a new label with generated ID", () => {
    const data = emptyData();
    const result = addLabel(data, "Mom", "#bbf7d0");
    expect(result.labels).toHaveLength(1);
    expect(result.labels[0].name).toBe("Mom");
    expect(result.labels[0].color).toBe("#bbf7d0");
    expect(result.labels[0].id).toBeTruthy();
  });

  it("does not mutate original data", () => {
    const data = emptyData();
    const result = addLabel(data, "Mom", "#bbf7d0");
    expect(data.labels).toHaveLength(0);
    expect(result).not.toBe(data);
  });
});

describe("updateLabel", () => {
  it("updates name and color of existing label", () => {
    let data = addLabel(emptyData(), "Mom", "#bbf7d0");
    const id = data.labels[0].id;
    data = updateLabel(data, id, "Mother", "#00ff00");
    expect(data.labels[0].name).toBe("Mother");
    expect(data.labels[0].color).toBe("#00ff00");
  });
});

describe("deleteLabel", () => {
  it("removes label and cascades to schedules and overrides", () => {
    let data = addLabel(emptyData(), "Mom", "#bbf7d0");
    data = addLabel(data, "Dad", "#fef08a");
    const momId = data.labels[0].id;
    const dadId = data.labels[1].id;
    data = addSchedule(data, "2026-03-02", 2, [momId, dadId]);
    data = setDayOverride(data, "2026-03-05", momId);

    data = deleteLabel(data, momId);
    expect(data.labels).toHaveLength(1);
    expect(data.labels[0].id).toBe(dadId);
    expect(data.schedules).toHaveLength(0);
    expect(data.overrides).toHaveLength(0);
  });
});

describe("addSchedule", () => {
  it("inserts schedules in startDate order", () => {
    let data = addLabel(emptyData(), "Mom", "#bbf7d0");
    data = addLabel(data, "Dad", "#fef08a");
    const [momId, dadId] = data.labels.map((l) => l.id);

    data = addSchedule(data, "2026-06-01", 1, [momId, dadId]);
    data = addSchedule(data, "2026-03-02", 2, [momId, dadId]);

    expect(data.schedules).toHaveLength(2);
    expect(data.schedules[0].startDate).toBe("2026-03-02");
    expect(data.schedules[1].startDate).toBe("2026-06-01");
  });

  it("throws for invalid schedule input", () => {
    let data = addLabel(emptyData(), "Mom", "#bbf7d0");
    data = addLabel(data, "Dad", "#fef08a");
    const [momId] = data.labels.map((l) => l.id);

    expect(() =>
      addSchedule(data, "2026-03-02", 2, [momId, momId])
    ).toThrow("Labels must be different");
  });
});

describe("deleteSchedule", () => {
  it("removes the specified schedule", () => {
    let data = addLabel(emptyData(), "Mom", "#bbf7d0");
    data = addLabel(data, "Dad", "#fef08a");
    const [momId, dadId] = data.labels.map((l) => l.id);
    data = addSchedule(data, "2026-03-02", 2, [momId, dadId]);
    const schedId = data.schedules[0].id;

    data = deleteSchedule(data, schedId);
    expect(data.schedules).toHaveLength(0);
  });
});

describe("day overrides", () => {
  it("sets a new override", () => {
    let data = addLabel(emptyData(), "Mom", "#bbf7d0");
    const momId = data.labels[0].id;
    data = setDayOverride(data, "2026-03-05", momId);
    expect(data.overrides).toHaveLength(1);
    expect(data.overrides[0]).toEqual({ date: "2026-03-05", labelId: momId });
  });

  it("updates an existing override for the same date", () => {
    let data = addLabel(emptyData(), "Mom", "#bbf7d0");
    data = addLabel(data, "Dad", "#fef08a");
    const momId = data.labels[0].id;
    const dadId = data.labels[1].id;
    data = setDayOverride(data, "2026-03-05", momId);
    data = setDayOverride(data, "2026-03-05", dadId);
    expect(data.overrides).toHaveLength(1);
    expect(data.overrides[0].labelId).toBe(dadId);
  });

  it("removes an override", () => {
    let data = addLabel(emptyData(), "Mom", "#bbf7d0");
    const momId = data.labels[0].id;
    data = setDayOverride(data, "2026-03-05", momId);
    data = removeDayOverride(data, "2026-03-05");
    expect(data.overrides).toHaveLength(0);
  });
});
