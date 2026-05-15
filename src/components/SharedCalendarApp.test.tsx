import { act, render, screen } from "@testing-library/react";
import { SharedCalendarApp } from "./SharedCalendarApp";
import type { CustodyGroupState } from "@/lib/sharedCalendarTypes";

const state: CustodyGroupState = {
  groupId: "group-1",
  parents: [
    { id: "parent-a", email: "a@example.com", isInviteAdmin: true },
    { id: "parent-b", email: "b@example.com", isInviteAdmin: false },
  ],
  agreedCalendar: {
    version: 1,
    updatedAt: "2026-05-16T00:00:00.000Z",
    scheduleData: {
      labels: [
        { id: "mom", name: "Mom", color: "#bbf7d0" },
        { id: "dad", name: "Dad", color: "#fef08a" },
      ],
      schedules: [
        {
          id: "schedule-1",
          startDate: "2026-03-02",
          cycleWeeks: 1,
          labelIds: ["mom", "dad"],
        },
      ],
      overrides: [],
    },
  },
  draftProposals: [],
  activeProposal: null,
  proposalHistory: [],
  notes: [],
};

describe("SharedCalendarApp", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 1));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the agreed shared calendar read-only", () => {
    render(<SharedCalendarApp state={state} />);

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText("Custody Calendar")).toBeInTheDocument();
    expect(screen.queryByText("Schedule Editor")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "2026-03-02" })
    ).not.toBeInTheDocument();
  });
});
