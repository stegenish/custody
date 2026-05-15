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
    render(
      <SharedCalendarApp
        state={state}
        currentParentId="parent-a"
        startDraftAction={jest.fn()}
      />
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText("Custody Calendar")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Draft" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Schedule Editor")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "2026-03-02" })
    ).not.toBeInTheDocument();
  });

  it("renders the current parent's draft proposal as editable", () => {
    const draftScheduleData = {
      ...state.agreedCalendar.scheduleData,
      overrides: [{ date: "2026-03-02", labelId: "dad" }],
    };
    const stateWithDraft: CustodyGroupState = {
      ...state,
      draftProposals: [
        {
          id: "proposal-1",
          status: "draft",
          createdByParentId: "parent-a",
          currentAuthorParentId: "parent-a",
          baseCalendarVersion: 1,
          currentRevisionId: "revision-1",
          revisions: [
            {
              id: "revision-1",
              proposalId: "proposal-1",
              revisionNumber: 1,
              authorParentId: "parent-a",
              baseCalendarVersion: 1,
              scheduleData: draftScheduleData,
              createdAt: "2026-05-16T00:00:00.000Z",
            },
          ],
          comments: [],
          createdAt: "2026-05-16T00:00:00.000Z",
          updatedAt: "2026-05-16T00:00:00.000Z",
        },
      ],
    };

    render(
      <SharedCalendarApp
        state={stateWithDraft}
        currentParentId="parent-a"
        saveDraftAction={jest.fn()}
      />
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText("Draft Proposal")).toBeInTheDocument();
    expect(screen.getByText("Schedule Editor")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save Draft" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("proposal-change-indicator")).toBeInTheDocument();
    expect(
      document.querySelector<HTMLInputElement>('input[name="scheduleData"]')
        ?.value
    ).toContain('"date":"2026-03-02"');
  });
});
