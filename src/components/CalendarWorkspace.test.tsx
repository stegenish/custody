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
    fireEvent.click(screen.getByRole("button", { name: /2026-03-02/ }));
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

  it("opens the override bar for uncolored days in editable mode", () => {
    render(
      <CalendarWorkspace
        title="Custody Calendar"
        today={new Date(2026, 2, 1)}
        scheduleData={{ ...scheduleData, schedules: [] }}
        onUpdateScheduleData={jest.fn()}
      />
    );

    clickMarchSecond();

    expect(screen.getByTestId("day-override-bar")).toBeInTheDocument();
  });

  it("can jump directly to a date with the keyboard-friendly date control", () => {
    render(
      <CalendarWorkspace
        title="Custody Calendar"
        today={new Date(2026, 2, 1)}
        scheduleData={scheduleData}
        onUpdateScheduleData={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Jump to date"), {
      target: { value: "2026-03-02" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));

    expect(screen.getByTestId("day-override-bar")).toBeInTheDocument();
  });

  it("can render read-only without editor or override bar", () => {
    render(
      <CalendarWorkspace
        title="Custody Calendar"
        today={new Date(2026, 2, 1)}
        scheduleData={scheduleData}
        readOnly
        onUpdateScheduleData={jest.fn()}
      />
    );

    expect(screen.queryByText("Schedule Editor")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /2026-03-02/ })
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("day-override-bar")).not.toBeInTheDocument();
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
    fireEvent.click(
      within(screen.getByTestId("day-override-bar")).getByText("Dad")
    );

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

  it("shows shared date notes when a noted read-only date is selected", () => {
    render(
      <CalendarWorkspace
        title="Custody Calendar"
        today={new Date(2026, 2, 1)}
        scheduleData={scheduleData}
        sharedDateNotes={[
          {
            id: "note-1",
            authorParentId: "parent-a",
            date: "2026-03-02",
            body: "Remember school event",
            createdAt: "2026-05-16T00:00:00.000Z",
            updatedAt: "2026-05-16T00:00:00.000Z",
          },
        ]}
        readOnly
        onUpdateScheduleData={jest.fn()}
      />
    );

    clickMarchSecond();

    expect(screen.getByTestId("selected-date-details")).toBeInTheDocument();
    expect(screen.getByText("Remember school event")).toBeInTheDocument();
    expect(screen.queryByTestId("day-override-bar")).not.toBeInTheDocument();
  });

  it("shows proposal comments when a commented read-only date is selected", () => {
    render(
      <CalendarWorkspace
        title="Review Proposal"
        today={new Date(2026, 2, 1)}
        scheduleData={scheduleData}
        proposalComments={[
          {
            id: "comment-1",
            proposalId: "proposal-1",
            authorParentId: "parent-a",
            date: "2026-03-02",
            body: "Can we swap this date?",
            createdAt: "2026-05-16T00:00:00.000Z",
            updatedAt: "2026-05-16T00:00:00.000Z",
          },
        ]}
        readOnly
        onUpdateScheduleData={jest.fn()}
      />
    );

    clickMarchSecond();

    expect(screen.getByTestId("selected-date-details")).toBeInTheDocument();
    expect(screen.getByText("Can we swap this date?")).toBeInTheDocument();
  });
});
