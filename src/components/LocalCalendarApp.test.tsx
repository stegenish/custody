import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocalCalendarApp } from "./LocalCalendarApp";
import { loadDraftScheduleData, loadScheduleData, saveScheduleData } from "@/lib/storage";
import type { ScheduleData } from "@/lib/scheduleTypes";

const agreedScheduleData: ScheduleData = {
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
  overrides: [],
};

beforeEach(() => {
  localStorage.clear();
  saveScheduleData(agreedScheduleData);
});

describe("LocalCalendarApp", () => {
  it("renders agreed calendar mode by default", () => {
    render(<LocalCalendarApp today={new Date(2026, 2, 1)} />);

    expect(screen.getByText("Custody Calendar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Draft" })).toBeInTheDocument();
    expect(screen.queryByText("Schedule Editor")).not.toBeInTheDocument();
  });

  it("starts and persists a draft proposal", () => {
    render(<LocalCalendarApp today={new Date(2026, 2, 1)} />);

    fireEvent.click(screen.getByRole("button", { name: "Start Draft" }));

    expect(screen.getByText("Draft Proposal")).toBeInTheDocument();
    expect(loadDraftScheduleData()).toEqual(agreedScheduleData);
  });

  it("discards a draft proposal", () => {
    render(<LocalCalendarApp today={new Date(2026, 2, 1)} />);

    fireEvent.click(screen.getByRole("button", { name: "Start Draft" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));

    expect(screen.getByText("Custody Calendar")).toBeInTheDocument();
    expect(loadDraftScheduleData()).toBeNull();
  });

  it("applies a local draft to the agreed calendar", () => {
    render(<LocalCalendarApp today={new Date(2026, 2, 1)} />);

    fireEvent.click(screen.getByRole("button", { name: "Start Draft" }));
    fireEvent.click(screen.getByRole("button", { name: "2026-03-02" }));
    fireEvent.click(within(screen.getByTestId("day-override-bar")).getByText("Dad"));
    fireEvent.click(screen.getByRole("button", { name: "Apply Draft Locally" }));

    expect(loadScheduleData().overrides).toEqual([
      { date: "2026-03-02", labelId: "dad" },
    ]);
    expect(loadDraftScheduleData()).toBeNull();
  });
});
