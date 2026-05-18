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
    expect(
      screen.getByRole("dialog", { name: "Override 2026-03-05" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Override 2026-03-05" })
    ).toHaveAttribute("aria-modal", "true");
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

  it("refocuses the current label when the selected day changes", () => {
    const { rerender } = render(
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

    rerender(
      <DayOverrideBar
        dateKey="2026-03-06"
        currentLabelId="b"
        isOverride={false}
        labels={labels}
        onSetOverride={jest.fn()}
        onRemoveOverride={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Dad" })).toHaveFocus();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = jest.fn();
    render(
      <DayOverrideBar
        dateKey="2026-03-05"
        currentLabelId="a"
        isOverride={false}
        labels={labels}
        onSetOverride={jest.fn()}
        onRemoveOverride={jest.fn()}
        onClose={onClose}
      />
    );

    fireEvent.keyDown(
      screen.getByRole("dialog", { name: "Override 2026-03-05" }),
      { key: "Escape" }
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed outside the dialog focus", () => {
    const onClose = jest.fn();
    render(
      <DayOverrideBar
        dateKey="2026-03-05"
        currentLabelId="a"
        isOverride={false}
        labels={labels}
        onSetOverride={jest.fn()}
        onRemoveOverride={jest.fn()}
        onClose={onClose}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("traps Tab focus within dialog controls", () => {
    render(
      <DayOverrideBar
        dateKey="2026-03-05"
        currentLabelId="b"
        isOverride={true}
        labels={labels}
        onSetOverride={jest.fn()}
        onRemoveOverride={jest.fn()}
        onClose={jest.fn()}
      />
    );

    const closeButton = screen.getByRole("button", { name: "Close" });
    const clearButton = screen.getByRole("button", { name: "Clear Override" });

    clearButton.focus();
    fireEvent.keyDown(
      screen.getByRole("dialog", { name: "Override 2026-03-05" }),
      { key: "Tab" }
    );
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(
      screen.getByRole("dialog", { name: "Override 2026-03-05" }),
      { key: "Tab", shiftKey: true }
    );
    expect(clearButton).toHaveFocus();
  });

  it("restores focus to the previously focused element on unmount", () => {
    const opener = document.createElement("button");
    opener.textContent = "Open";
    document.body.append(opener);
    opener.focus();

    const { unmount } = render(
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

    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
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
