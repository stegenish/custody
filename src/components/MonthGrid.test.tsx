import { render, screen, fireEvent } from "@testing-library/react";
import { MonthGrid } from "./MonthGrid";
import { generateMonthGrid } from "@/lib/dateUtils";
import type { DayColorResult } from "@/lib/scheduleTypes";

const today = new Date(2026, 2, 1); // March 1, 2026

// Helper: generate a month grid with specific holidays
function gridWithHolidays(holidays: Set<string>) {
  return generateMonthGrid(2026, 2, today, holidays);
}

describe("MonthGrid", () => {
  const month = generateMonthGrid(2026, 2, today);

  it("renders the month and year header", () => {
    render(<MonthGrid month={month} />);
    expect(screen.getByText("March 2026")).toBeInTheDocument();
  });

  it("renders day-of-week headers starting with Mon", () => {
    render(<MonthGrid month={month} />);
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("renders ISO week numbers", () => {
    render(<MonthGrid month={month} />);
    const weekCells = screen.getAllByTestId("week-number");
    expect(weekCells[0]).toHaveTextContent("9");
  });

  it("highlights today", () => {
    render(<MonthGrid month={month} />);
    const todayCell = screen.getByTestId("today");
    expect(todayCell).toHaveTextContent("1");
  });

  it("dims non-current-month days", () => {
    render(<MonthGrid month={month} />);
    const dimmedCells = screen.getAllByTestId("day-other-month");
    expect(dimmedCells.length).toBeGreaterThan(0);
  });

  it("applies background color from colorMap", () => {
    const colorMap = new Map<string, DayColorResult>([
      [
        "2026-03-02",
        {
          label: { id: "mom", name: "Mom", color: "#bbf7d0" },
          isOverride: false,
        },
      ],
    ]);
    render(<MonthGrid month={month} colorMap={colorMap} />);
    const cells = screen.getAllByTestId("day-current-month");
    const mar2Cell = cells.find((c) => c.textContent === "2");
    expect(mar2Cell?.style.backgroundColor).toBeTruthy();
  });

  it("renders without background color when colorMap is empty", () => {
    const colorMap = new Map<string, DayColorResult>();
    render(<MonthGrid month={month} colorMap={colorMap} />);
    const cells = screen.getAllByTestId("day-current-month");
    expect(cells[0].style.backgroundColor).toBe("");
  });

  it("calls onDayClick with dateKey when a colored day is clicked", () => {
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
    render(<MonthGrid month={month} colorMap={colorMap} onDayClick={onClick} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(onClick).toHaveBeenCalledWith("2026-03-02");
  });

  it("renders a gradient background for split-color changeover days", () => {
    const colorMap = new Map<string, DayColorResult>([
      [
        "2026-03-02",
        {
          label: { id: "dad", name: "Dad", color: "#fef08a" },
          isOverride: false,
          outgoingLabel: { id: "mom", name: "Mom", color: "#bbf7d0" },
        },
      ],
    ]);
    render(<MonthGrid month={month} colorMap={colorMap} />);
    const cells = screen.getAllByTestId("day-current-month");
    const mar2Cell = cells.find((c) => c.textContent === "2");
    expect(mar2Cell?.style.background).toContain("linear-gradient");
    expect(mar2Cell?.style.background).toContain("#bbf7d0");
    expect(mar2Cell?.style.background).toContain("#fef08a");
    // Should NOT have a flat backgroundColor
    expect(mar2Cell?.style.backgroundColor).toBe("");
  });

  it("renders red text for a holiday in the current month", () => {
    // March 8, 2026 is a Sunday (holiday)
    const monthWithHolidays = gridWithHolidays(new Set(["2026-03-08"]));
    render(<MonthGrid month={monthWithHolidays} />);
    const cells = screen.getAllByTestId("day-current-month");
    const mar8 = cells.find((c) => c.textContent === "8");
    expect(mar8?.className).toContain("text-red-600");
  });

  it("does not render red text for a non-holiday day", () => {
    const monthWithHolidays = gridWithHolidays(new Set(["2026-03-08"]));
    render(<MonthGrid month={monthWithHolidays} />);
    const cells = screen.getAllByTestId("day-current-month");
    const mar9 = cells.find((c) => c.textContent === "9");
    expect(mar9?.className).not.toContain("text-red-600");
  });

  it("does not render red text for other-month holidays", () => {
    // Feb 23 is in the grid but not current month
    const monthWithHolidays = gridWithHolidays(new Set(["2026-02-23"]));
    render(<MonthGrid month={monthWithHolidays} />);
    const otherCells = screen.getAllByTestId("day-other-month");
    const feb23 = otherCells.find((c) => c.textContent === "23");
    expect(feb23?.className).not.toContain("text-red-600");
  });
});
