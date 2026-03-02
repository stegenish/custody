import { render, screen, fireEvent } from "@testing-library/react";
import { ScheduleEditor } from "./ScheduleEditor";
import type { ScheduleData } from "@/lib/scheduleTypes";

function emptyData(): ScheduleData {
  return { labels: [], schedules: [], overrides: [] };
}

describe("ScheduleEditor", () => {
  it("shows onboarding message when no labels exist", () => {
    render(
      <ScheduleEditor
        scheduleData={emptyData()}
        onUpdateScheduleData={jest.fn()}
      />
    );
    expect(
      screen.getByText(/Get started by creating labels/)
    ).toBeInTheDocument();
  });

  it("toggles collapse/expand", () => {
    render(
      <ScheduleEditor
        scheduleData={emptyData()}
        onUpdateScheduleData={jest.fn()}
      />
    );
    // Editor content should be visible by default (no labels = open)
    expect(screen.getByText("Labels")).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Collapse/i));
    expect(screen.queryByText("Labels")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Expand/i));
    expect(screen.getByText("Labels")).toBeInTheDocument();
  });

  it("calls onUpdateScheduleData when a label is added", () => {
    const onUpdate = jest.fn();
    render(
      <ScheduleEditor
        scheduleData={emptyData()}
        onUpdateScheduleData={onUpdate}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Label name"), {
      target: { value: "Mom" },
    });
    fireEvent.click(screen.getByText("Add Label"));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    const newData = onUpdate.mock.calls[0][0] as ScheduleData;
    expect(newData.labels).toHaveLength(1);
    expect(newData.labels[0].name).toBe("Mom");
  });
});
