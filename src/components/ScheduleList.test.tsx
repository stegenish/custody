import { render, screen, fireEvent } from "@testing-library/react";
import { ScheduleList } from "./ScheduleList";
import type { CustodyLabel, CustodySchedule } from "@/lib/scheduleTypes";

const labels: CustodyLabel[] = [
  { id: "a", name: "Mom", color: "#bbf7d0" },
  { id: "b", name: "Dad", color: "#fef08a" },
];

const schedules: CustodySchedule[] = [
  { id: "s1", startDate: "2026-03-02", cycleWeeks: 2, labelIds: ["a", "b"] },
];

describe("ScheduleList", () => {
  it("renders existing schedules with label names", () => {
    render(
      <ScheduleList
        schedules={schedules}
        labels={labels}
        onAddSchedule={jest.fn()}
        onDeleteSchedule={jest.fn()}
      />
    );
    expect(screen.getByText(/2026-03-02/)).toBeInTheDocument();
    expect(screen.getByText("Mom / Dad")).toBeInTheDocument();
  });

  it("passes the chosen start date through to onAddSchedule", () => {
    const onAdd = jest.fn();
    render(
      <ScheduleList
        schedules={[]}
        labels={labels}
        onAddSchedule={onAdd}
        onDeleteSchedule={jest.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-03-13" },
    });
    fireEvent.click(screen.getByText("Add Schedule"));
    // Friday start date passed as-is — cycle aligns to Fridays
    expect(onAdd).toHaveBeenCalledWith("2026-03-13", expect.any(Number), [
      "a",
      "b",
    ]);
  });

  it("shows disabled message when fewer than 2 labels", () => {
    render(
      <ScheduleList
        schedules={[]}
        labels={[labels[0]]}
        onAddSchedule={jest.fn()}
        onDeleteSchedule={jest.fn()}
      />
    );
    expect(
      screen.getByText(/Create at least 2 labels/)
    ).toBeInTheDocument();
  });

  it("calls onDeleteSchedule when delete button is clicked", () => {
    const onDelete = jest.fn();
    render(
      <ScheduleList
        schedules={schedules}
        labels={labels}
        onAddSchedule={jest.fn()}
        onDeleteSchedule={onDelete}
      />
    );
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith("s1");
  });
});
