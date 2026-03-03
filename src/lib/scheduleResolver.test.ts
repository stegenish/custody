import {
  formatDateKey,
  parseDateKey,
  findActiveSchedule,
  resolveScheduleLabel,
  resolveDayColor,
  buildColorMap,
} from "./scheduleResolver";
import type {
  CustodySchedule,
  CustodyLabel,
  DayOverride,
  ScheduleData,
} from "./scheduleTypes";

// --- formatDateKey / parseDateKey ---

describe("formatDateKey", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(formatDateKey(new Date(2026, 2, 1))).toBe("2026-03-01");
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
});

// --- findActiveSchedule ---

describe("findActiveSchedule", () => {
  const scheduleA: CustodySchedule = {
    id: "a",
    startDate: "2026-01-05", // Monday
    cycleWeeks: 2,
    labelIds: ["1", "2"],
  };
  const scheduleB: CustodySchedule = {
    id: "b",
    startDate: "2026-03-02", // Monday
    cycleWeeks: 1,
    labelIds: ["1", "2"],
  };

  it("returns null when no schedules exist", () => {
    expect(findActiveSchedule(new Date(2026, 2, 1), [])).toBeNull();
  });

  it("returns null when the date is before all schedules", () => {
    expect(findActiveSchedule(new Date(2025, 11, 1), [scheduleA])).toBeNull();
  });

  it("returns the schedule when the date is on or after its start", () => {
    expect(findActiveSchedule(new Date(2026, 1, 10), [scheduleA])).toBe(
      scheduleA
    );
  });

  it("returns the correct schedule when multiple schedules exist", () => {
    const schedules = [scheduleA, scheduleB];
    // Feb 10 falls between A and B → A is active
    expect(findActiveSchedule(new Date(2026, 1, 10), schedules)).toBe(
      scheduleA
    );
    // Mar 5 is after B starts → B is active
    expect(findActiveSchedule(new Date(2026, 2, 5), schedules)).toBe(
      scheduleB
    );
  });
});

// --- resolveScheduleLabel ---

describe("resolveScheduleLabel", () => {
  const schedule: CustodySchedule = {
    id: "s1",
    startDate: "2026-02-23", // Monday
    cycleWeeks: 2,
    labelIds: ["mom", "dad"],
  };

  it("returns the first label on the start date", () => {
    expect(resolveScheduleLabel(new Date(2026, 1, 23), schedule)).toBe("mom");
  });

  it("returns the first label within the first cycle", () => {
    // Day 3 of the first 2-week cycle (Feb 25, Wed)
    expect(resolveScheduleLabel(new Date(2026, 1, 25), schedule)).toBe("mom");
  });

  it("returns the second label after one full cycle", () => {
    // Week 3 from start → second label (Mar 9, Monday = start of week 3)
    expect(resolveScheduleLabel(new Date(2026, 2, 9), schedule)).toBe("dad");
  });

  it("alternates back to the first label after two full cycles", () => {
    // Week 5 from start → first label again (Mar 23, Monday = start of week 5)
    expect(resolveScheduleLabel(new Date(2026, 2, 23), schedule)).toBe("mom");
  });

  it("works with a 1-week cycle", () => {
    const weekly: CustodySchedule = {
      id: "w",
      startDate: "2026-02-23",
      cycleWeeks: 1,
      labelIds: ["mom", "dad"],
    };
    expect(resolveScheduleLabel(new Date(2026, 1, 23), weekly)).toBe("mom");
    expect(resolveScheduleLabel(new Date(2026, 2, 2), weekly)).toBe("dad");
    expect(resolveScheduleLabel(new Date(2026, 2, 9), weekly)).toBe("mom");
  });

  it("aligns cycle boundary to the start date's day of week, not Monday", () => {
    // Start on Friday Mar 13 with 2-week cycle
    const fridaySchedule: CustodySchedule = {
      id: "f",
      startDate: "2026-03-13", // Friday
      cycleWeeks: 2,
      labelIds: ["mom", "dad"],
    };
    // Days 0-13 (Fri Mar 13 – Thu Mar 26) → mom
    expect(resolveScheduleLabel(new Date(2026, 2, 13), fridaySchedule)).toBe("mom");
    expect(resolveScheduleLabel(new Date(2026, 2, 26), fridaySchedule)).toBe("mom");
    // Day 14 (Fri Mar 27) → dad (new cycle starts on Friday)
    expect(resolveScheduleLabel(new Date(2026, 2, 27), fridaySchedule)).toBe("dad");
    // Day 27 (Thu Apr 9) → still dad
    expect(resolveScheduleLabel(new Date(2026, 3, 9), fridaySchedule)).toBe("dad");
    // Day 28 (Fri Apr 10) → mom again
    expect(resolveScheduleLabel(new Date(2026, 3, 10), fridaySchedule)).toBe("mom");
  });
});

// --- resolveDayColor ---

describe("resolveDayColor", () => {
  const labels: CustodyLabel[] = [
    { id: "mom", name: "Mom", color: "#bbf7d0" },
    { id: "dad", name: "Dad", color: "#fef08a" },
  ];
  const schedule: CustodySchedule = {
    id: "s1",
    startDate: "2026-02-23",
    cycleWeeks: 2,
    labelIds: ["mom", "dad"],
  };

  it("returns null when no schedule covers the date", () => {
    expect(
      resolveDayColor(new Date(2026, 1, 1), [], [], labels)
    ).toBeNull();
  });

  it("returns the correct color from the active schedule", () => {
    const result = resolveDayColor(
      new Date(2026, 1, 23),
      [schedule],
      [],
      labels
    );
    expect(result).toEqual({
      labelId: "mom",
      labelName: "Mom",
      color: "#bbf7d0",
      isOverride: false,
    });
  });

  it("override takes precedence over the schedule", () => {
    const overrides: DayOverride[] = [
      { date: "2026-02-23", labelId: "dad" },
    ];
    const result = resolveDayColor(
      new Date(2026, 1, 23),
      [schedule],
      overrides,
      labels
    );
    expect(result).toEqual({
      labelId: "dad",
      labelName: "Dad",
      color: "#fef08a",
      isOverride: true,
    });
  });

  it("returns correct color under the second schedule", () => {
    const scheduleB: CustodySchedule = {
      id: "s2",
      startDate: "2026-03-09",
      cycleWeeks: 1,
      labelIds: ["dad", "mom"],
    };
    const result = resolveDayColor(
      new Date(2026, 2, 9),
      [schedule, scheduleB],
      [],
      labels
    );
    expect(result).toEqual({
      labelId: "dad",
      labelName: "Dad",
      color: "#fef08a",
      isOverride: false,
    });
  });
});

// --- buildColorMap ---

describe("buildColorMap", () => {
  const labels: CustodyLabel[] = [
    { id: "mom", name: "Mom", color: "#bbf7d0" },
    { id: "dad", name: "Dad", color: "#fef08a" },
  ];

  it("returns an empty map when no schedules exist", () => {
    const data: ScheduleData = { labels, schedules: [], overrides: [] };
    const map = buildColorMap(new Date(2026, 2, 1), new Date(2026, 2, 7), data);
    expect(map.size).toBe(0);
  });

  it("returns correct colors for a 2-week range with one schedule", () => {
    const data: ScheduleData = {
      labels,
      schedules: [
        {
          id: "s1",
          startDate: "2026-02-23",
          cycleWeeks: 1,
          labelIds: ["mom", "dad"],
        },
      ],
      overrides: [],
    };
    // Feb 23 (Mon) to Mar 1 (Sun) = week 1 → mom
    // Mar 2 (Mon) to Mar 8 (Sun) = week 2 → dad
    const map = buildColorMap(
      new Date(2026, 1, 23),
      new Date(2026, 2, 8),
      data
    );
    expect(map.get("2026-02-23")?.labelId).toBe("mom");
    expect(map.get("2026-03-01")?.labelId).toBe("mom");
    expect(map.get("2026-03-02")?.labelId).toBe("dad");
    expect(map.get("2026-03-08")?.labelId).toBe("dad");
  });

  it("handles schedule transitions mid-range", () => {
    const data: ScheduleData = {
      labels,
      schedules: [
        {
          id: "s1",
          startDate: "2026-02-23",
          cycleWeeks: 2,
          labelIds: ["mom", "dad"],
        },
        {
          id: "s2",
          startDate: "2026-03-09",
          cycleWeeks: 1,
          labelIds: ["dad", "mom"],
        },
      ],
      overrides: [],
    };
    const map = buildColorMap(
      new Date(2026, 1, 23),
      new Date(2026, 2, 15),
      data
    );
    // Under schedule s1 (2-week cycle, mom first): Feb 23 → mom
    expect(map.get("2026-02-23")?.labelId).toBe("mom");
    // Under schedule s2 (starts Mar 9, 1-week cycle, dad first): Mar 9 → dad
    expect(map.get("2026-03-09")?.labelId).toBe("dad");
  });

  it("sets splitColor on changeover days", () => {
    // 1-week cycle: mom weeks alternate with dad weeks
    const data: ScheduleData = {
      labels,
      schedules: [
        {
          id: "s1",
          startDate: "2026-02-23", // Monday
          cycleWeeks: 1,
          labelIds: ["mom", "dad"],
        },
      ],
      overrides: [],
    };
    const map = buildColorMap(
      new Date(2026, 1, 23),
      new Date(2026, 2, 8),
      data
    );
    // Feb 23 (Mon) is the first day — no previous label, no split
    expect(map.get("2026-02-23")?.splitColor).toBeUndefined();
    // Feb 28 (Sat) is mid-cycle — same label, no split
    expect(map.get("2026-02-28")?.splitColor).toBeUndefined();
    // Mar 2 (Mon) is the changeover day — dad starts, mom was outgoing
    expect(map.get("2026-03-02")?.splitColor).toBe("#bbf7d0"); // mom's color
    expect(map.get("2026-03-02")?.color).toBe("#fef08a"); // dad's color
    // Mar 3 (Tue) is not a changeover — no split
    expect(map.get("2026-03-03")?.splitColor).toBeUndefined();
  });

  it("does not set splitColor on override days", () => {
    const data: ScheduleData = {
      labels,
      schedules: [
        {
          id: "s1",
          startDate: "2026-02-23",
          cycleWeeks: 1,
          labelIds: ["mom", "dad"],
        },
      ],
      // Override on the changeover day
      overrides: [{ date: "2026-03-02", labelId: "mom" }],
    };
    const map = buildColorMap(
      new Date(2026, 1, 23),
      new Date(2026, 2, 8),
      data
    );
    // Mar 2 is overridden — should NOT get splitColor even though labels would differ
    expect(map.get("2026-03-02")?.isOverride).toBe(true);
    expect(map.get("2026-03-02")?.splitColor).toBeUndefined();
  });
});
