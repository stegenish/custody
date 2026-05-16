import { act, render, screen } from "@testing-library/react";
import { useClientToday } from "./useClientToday";

function ClientTodayHarness() {
  const today = useClientToday();
  return <output>{today ? today.toISOString() : "loading"}</output>;
}

describe("useClientToday", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-01T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns null until the client date timer has run", () => {
    render(<ClientTodayHarness />);

    expect(screen.getByText("loading")).toBeInTheDocument();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText("2026-03-01T12:00:00.000Z")).toBeInTheDocument();
  });
});
