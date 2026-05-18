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

  it("can route existing label edits to personal label preferences", () => {
    const onUpdate = jest.fn();
    const onUpdateLabelPreference = jest.fn();
    const scheduleData: ScheduleData = {
      labels: [{ id: "mom", name: "Mom", color: "#bbf7d0" }],
      schedules: [],
      overrides: [],
    };

    render(
      <ScheduleEditor
        scheduleData={scheduleData}
        labelEditMode="personal"
        onUpdateScheduleData={onUpdate}
        onUpdateLabelPreference={onUpdateLabelPreference}
      />
    );

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByLabelText("Edit Mom name"), {
      target: { value: "Thomas" },
    });
    fireEvent.change(screen.getByLabelText("Edit Mom color"), {
      target: { value: "#123456" },
    });
    fireEvent.click(screen.getByText("Save"));

    expect(onUpdateLabelPreference).toHaveBeenCalledWith(
      "mom",
      "Thomas",
      "#123456"
    );
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
