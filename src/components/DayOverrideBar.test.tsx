import { render, screen, fireEvent } from "@testing-library/react";
import { DayOverrideBar } from "./DayOverrideBar";
import type { CustodyLabel } from "@/lib/scheduleTypes";

const labels: CustodyLabel[] = [
  { id: "a", name: "Mom", color: "#bbf7d0" },
  { id: "b", name: "Dad", color: "#fef08a" },
];

describe("DayOverrideBar", () => {
  it("renders the date heading and label buttons", () => {
    render(
      <DayOverrideBar
        dateKey="2026-03-05"
        currentLabelId="a"
        isOverride={false}
        labels={labels}
        onSetOverride={jest.fn()}
        onRemoveOverride={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText("2026-03-05")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mom" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dad" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mom" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("focuses the current label when opened", () => {
    render(
      <DayOverrideBar
        dateKey="2026-03-05"
        currentLabelId="a"
        isOverride={false}
        labels={labels}
        onSetOverride={jest.fn()}
        onRemoveOverride={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Mom" })).toHaveFocus();
  });

  it("calls onSetOverride when a label button is clicked", () => {
    const onSet = jest.fn();
    render(
      <DayOverrideBar
        dateKey="2026-03-05"
        currentLabelId="a"
        isOverride={false}
        labels={labels}
        onSetOverride={onSet}
        onRemoveOverride={jest.fn()}
        onClose={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Dad" }));
    expect(onSet).toHaveBeenCalledWith("2026-03-05", "b");
  });

  it("shows Clear Override button when isOverride is true", () => {
    const onRemove = jest.fn();
    render(
      <DayOverrideBar
        dateKey="2026-03-05"
        currentLabelId="a"
        isOverride={true}
        labels={labels}
        onSetOverride={jest.fn()}
        onRemoveOverride={onRemove}
        onClose={jest.fn()}
      />
    );
    const clearBtn = screen.getByText("Clear Override");
    fireEvent.click(clearBtn);
    expect(onRemove).toHaveBeenCalledWith("2026-03-05");
  });

  it("does not show Clear Override button when isOverride is false", () => {
    render(
      <DayOverrideBar
        dateKey="2026-03-05"
        currentLabelId="a"
        isOverride={false}
        labels={labels}
        onSetOverride={jest.fn()}
        onRemoveOverride={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(screen.queryByText("Clear Override")).not.toBeInTheDocument();
  });
});
