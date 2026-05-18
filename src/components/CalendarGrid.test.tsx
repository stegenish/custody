import { render, screen, fireEvent } from "@testing-library/react";
import { CalendarGrid } from "./CalendarGrid";
import { generateCalendar } from "@/lib/dateUtils";
import type { DayColorResult } from "@/lib/scheduleTypes";

const today = new Date(2026, 2, 1);

describe("CalendarGrid", () => {
  const calendar = generateCalendar(today);

  it("renders all 15 months", () => {
    render(<CalendarGrid months={calendar} />);
    expect(
      screen.getByRole("region", { name: "15-month custody calendar" })
    ).toBeInTheDocument();
    expect(screen.getByText("December 2025")).toBeInTheDocument();
    expect(screen.getByText("March 2026")).toBeInTheDocument();
    expect(screen.getByText("February 2027")).toBeInTheDocument();
  });

  it("passes colorMap through to MonthGrid children", () => {
    const colorMap = new Map<string, DayColorResult>([
      [
        "2026-03-02",
        {
          label: { id: "mom", name: "Mom", color: "#bbf7d0" },
          isOverride: false,
        },
      ],
    ]);
    render(<CalendarGrid months={calendar} colorMap={colorMap} />);
    // At least one cell should have a background-color style applied
    const allCells = screen.getAllByTestId("day-current-month");
    const coloredCells = allCells.filter(
      (c) => c.style.backgroundColor !== ""
    );
    expect(coloredCells.length).toBeGreaterThan(0);
  });

  it("passes onDayClick through to MonthGrid children", () => {
    const colorMap = new Map<string, DayColorResult>([
      [
        "2026-03-02",
        {
          label: { id: "mom", name: "Mom", color: "#bbf7d0" },
          isOverride: false,
        },
      ],
    ]);
    const onClick = jest.fn();
    render(
      <CalendarGrid months={calendar} colorMap={colorMap} onDayClick={onClick} />
    );
    fireEvent.click(screen.getByRole("button", { name: /2026-03-02/ }));
    expect(onClick).toHaveBeenCalledWith("2026-03-02");
  });

  it("passes changed date keys through to MonthGrid children", () => {
    render(
      <CalendarGrid
        months={calendar}
        changedDateKeys={new Set(["2026-03-02"])}
      />
    );
    expect(screen.getByTestId("proposal-change-indicator")).toBeInTheDocument();
  });

  it("passes shared note date keys through to MonthGrid children", () => {
    render(
      <CalendarGrid
        months={calendar}
        noteDateKeys={new Set(["2026-03-02"])}
      />
    );
    expect(screen.getByTestId("shared-note-indicator")).toBeInTheDocument();
  });

  it("passes proposal comment date keys through to MonthGrid children", () => {
    render(
      <CalendarGrid
        months={calendar}
        commentDateKeys={new Set(["2026-03-02"])}
      />
    );
    expect(screen.getByTestId("proposal-comment-indicator")).toBeInTheDocument();
  });
});
