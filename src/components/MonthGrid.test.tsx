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
    const mar2Cell = screen.getByText("Custody: Mom").closest("td");
    expect(mar2Cell?.style.backgroundColor).toBe("rgb(187, 247, 208)");
  });

  it("renders non-color custody text for colored days", () => {
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

    expect(screen.getByText("Custody: Mom")).toBeInTheDocument();
  });

  it("renders a visible custody initial for colored days", () => {
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

    expect(screen.getByTestId("custody-label-indicator")).toHaveTextContent("M");
  });

  it("renders non-color changeover text for split-color days", () => {
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

    expect(screen.getByText("Changeover: Mom to Dad")).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: /2026-03-02/ }));
    expect(onClick).toHaveBeenCalledWith("2026-03-02");
  });

  it("calls onDayClick for uncolored days", () => {
    const onClick = jest.fn();
    render(<MonthGrid month={month} colorMap={new Map()} onDayClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: /2026-03-02/ }));
    expect(onClick).toHaveBeenCalledWith("2026-03-02");
  });

  it("handles keyboard selection for days", () => {
    const onClick = jest.fn();
    render(<MonthGrid month={month} colorMap={new Map()} onDayClick={onClick} />);
    const mar2 = screen.getByRole("button", { name: /2026-03-02/ });
    fireEvent.keyDown(mar2, { key: "Enter" });
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
    const mar2Cell = screen.getByText("Changeover: Mom to Dad").closest("td");
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

  it("renders a separate school holiday indicator", () => {
    const monthWithSchoolHoliday = generateMonthGrid(
      2026,
      2,
      today,
      new Set(),
      new Set(["2026-03-02"])
    );
    render(<MonthGrid month={monthWithSchoolHoliday} />);
    expect(screen.getByTestId("school-holiday-indicator")).toBeInTheDocument();
  });

  it("renders a proposal change indicator for changed dates", () => {
    render(
      <MonthGrid
        month={month}
        changedDateKeys={new Set(["2026-03-02"])}
      />
    );
    expect(screen.getByTestId("proposal-change-indicator")).toBeInTheDocument();
  });

  it("renders a shared note indicator for noted dates", () => {
    render(
      <MonthGrid
        month={month}
        noteDateKeys={new Set(["2026-03-02"])}
      />
    );
    expect(screen.getByTestId("shared-note-indicator")).toBeInTheDocument();
  });

  it("renders a proposal comment indicator for commented dates", () => {
    render(
      <MonthGrid
        month={month}
        commentDateKeys={new Set(["2026-03-02"])}
      />
    );
    expect(screen.getByTestId("proposal-comment-indicator")).toBeInTheDocument();
  });

  it("includes non-color date statuses in clickable day names", () => {
    const colorMap = new Map<string, DayColorResult>([
      [
        "2026-03-02",
        {
          label: { id: "mom", name: "Mom", color: "#bbf7d0" },
          isOverride: false,
        },
      ],
    ]);
    const monthWithSchoolHoliday = generateMonthGrid(
      2026,
      2,
      today,
      new Set(),
      new Set(["2026-03-02"])
    );

    render(
      <MonthGrid
        month={monthWithSchoolHoliday}
        colorMap={colorMap}
        changedDateKeys={new Set(["2026-03-02"])}
        noteDateKeys={new Set(["2026-03-02"])}
        commentDateKeys={new Set(["2026-03-02"])}
        onDayClick={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", {
        name: /Custody: Mom.*School holiday.*Proposal changes this date.*Has shared note.*Has proposal comment/,
      })
    ).toBeInTheDocument();
  });
});
