import { render, screen, fireEvent } from "@testing-library/react";
import { MonthGrid } from "./MonthGrid";
import { generateMonthGrid } from "@/lib/dateUtils";
import type { DayColorResult } from "@/lib/scheduleTypes";

const today = new Date(2026, 2, 1); // March 1, 2026

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
          labelId: "mom",
          labelName: "Mom",
          color: "#bbf7d0",
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
          labelId: "mom",
          labelName: "Mom",
          color: "#bbf7d0",
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
});
