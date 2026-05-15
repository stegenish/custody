import { fireEvent, render, screen, within } from "@testing-library/react";
import { CalendarWorkspace } from "./CalendarWorkspace";
import type { ScheduleData } from "@/lib/scheduleTypes";

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
  overrides: [],
};

describe("CalendarWorkspace", () => {
  function clickMarchSecond() {
    const dayButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent === "2");
    if (!dayButton) throw new Error("March 2 button not found");
    fireEvent.click(dayButton);
  }

  it("renders the title, editor, and calendar", () => {
    render(
      <CalendarWorkspace
        title="Custody Calendar"
        today={new Date(2026, 2, 1)}
        scheduleData={scheduleData}
        onUpdateScheduleData={jest.fn()}
      />
    );

    expect(screen.getByText("Custody Calendar")).toBeInTheDocument();
    expect(screen.getByText("Schedule Editor")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-grid")).toBeInTheDocument();
  });

  it("opens the override bar for colored days", () => {
    render(
      <CalendarWorkspace
        title="Custody Calendar"
        today={new Date(2026, 2, 1)}
        scheduleData={scheduleData}
        onUpdateScheduleData={jest.fn()}
      />
    );

    clickMarchSecond();

    const overrideBar = screen.getByTestId("day-override-bar");
    expect(overrideBar).toBeInTheDocument();
    expect(within(overrideBar).getByText("2026-03-02")).toBeInTheDocument();
  });

  it("applies day override updates", () => {
    const onUpdate = jest.fn();
    render(
      <CalendarWorkspace
        title="Custody Calendar"
        today={new Date(2026, 2, 1)}
        scheduleData={scheduleData}
        onUpdateScheduleData={onUpdate}
      />
    );

    clickMarchSecond();
    fireEvent.click(within(screen.getByTestId("day-override-bar")).getByText("Dad"));

    expect(onUpdate).toHaveBeenCalledWith({
      ...scheduleData,
      overrides: [{ date: "2026-03-02", labelId: "dad" }],
    });
  });

  it("passes changed date keys into the calendar", () => {
    render(
      <CalendarWorkspace
        title="Proposal Preview"
        today={new Date(2026, 2, 1)}
        scheduleData={scheduleData}
        changedDateKeys={new Set(["2026-03-02"])}
        onUpdateScheduleData={jest.fn()}
      />
    );

    expect(screen.getByTestId("proposal-change-indicator")).toBeInTheDocument();
  });
});
