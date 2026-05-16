import { act, fireEvent, render, screen } from "@testing-library/react";
import { SharedCalendarApp } from "./SharedCalendarApp";
import type {
  CalendarProposal,
  CustodyGroupState,
} from "@/lib/sharedCalendarTypes";
import type { ScheduleData } from "@/lib/scheduleTypes";

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

function createActiveProposal(
  scheduleData: ScheduleData = state.agreedCalendar.scheduleData
): CalendarProposal {
  return {
    id: "proposal-1",
    status: "sent",
    createdByParentId: "parent-a",
    currentAuthorParentId: "parent-a",
    receiverParentId: "parent-b",
    baseCalendarVersion: 1,
    currentRevisionId: "revision-1",
    revisions: [
      {
        id: "revision-1",
        proposalId: "proposal-1",
        revisionNumber: 1,
        authorParentId: "parent-a",
        baseCalendarVersion: 1,
        scheduleData,
        createdAt: "2026-05-16T00:00:00.000Z",
      },
    ],
    comments: [],
    createdAt: "2026-05-16T00:00:00.000Z",
    updatedAt: "2026-05-16T00:00:00.000Z",
  };
}

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

  it("renders shared date note indicators on the agreed calendar", () => {
    const stateWithNote: CustodyGroupState = {
      ...state,
      notes: [
        {
          id: "note-1",
          authorParentId: "parent-a",
          date: "2026-03-02",
          body: "Remember school event",
          createdAt: "2026-05-16T00:00:00.000Z",
          updatedAt: "2026-05-16T00:00:00.000Z",
        },
      ],
    };

    render(
      <SharedCalendarApp
        state={stateWithNote}
        currentParentId="parent-a"
        startDraftAction={jest.fn()}
      />
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByTestId("shared-note-indicator")).toBeInTheDocument();
  });

  it("shows shared date notes when a noted date is selected", () => {
    const stateWithNote: CustodyGroupState = {
      ...state,
      notes: [
        {
          id: "note-1",
          authorParentId: "parent-a",
          date: "2026-03-02",
          body: "Remember school event",
          createdAt: "2026-05-16T00:00:00.000Z",
          updatedAt: "2026-05-16T00:00:00.000Z",
        },
      ],
    };

    render(
      <SharedCalendarApp
        state={stateWithNote}
        currentParentId="parent-a"
        startDraftAction={jest.fn()}
      />
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });
    fireEvent.click(screen.getByRole("button", { name: "2026-03-02" }));

    expect(screen.getByText("Remember school event")).toBeInTheDocument();
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
        sendDraftAction={jest.fn()}
        resetDraftAction={jest.fn()}
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
    expect(
      screen.getByRole("button", { name: "Send Proposal" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reset Draft" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("proposal-change-indicator")).toBeInTheDocument();
    expect(
      document.querySelectorAll<HTMLInputElement>(
        'input[name="scheduleData"]'
      )[0]?.value
    ).toContain('"date":"2026-03-02"');
  });

  it("renders an active proposal for receiver review", () => {
    const proposedScheduleData = {
      ...state.agreedCalendar.scheduleData,
      overrides: [{ date: "2026-03-02", labelId: "dad" }],
    };
    const stateWithActiveProposal: CustodyGroupState = {
      ...state,
      activeProposal: createActiveProposal(proposedScheduleData),
    };

    render(
      <SharedCalendarApp
        state={stateWithActiveProposal}
        currentParentId="parent-b"
        startDraftAction={jest.fn()}
        acceptProposalAction={jest.fn()}
        rejectProposalAction={jest.fn()}
      />
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText("Review Proposal")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Accept Proposal" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reject Proposal" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Schedule Editor")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Start Draft" })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("proposal-change-indicator")).toBeInTheDocument();
    expect(
      document.querySelector<HTMLInputElement>('input[name="revisionId"]')
        ?.value
    ).toBe("revision-1");
  });

  it("renders proposal comment indicators on active proposals", () => {
    const activeProposal = createActiveProposal({
      ...state.agreedCalendar.scheduleData,
      overrides: [{ date: "2026-03-02", labelId: "dad" }],
    });
    const stateWithComment: CustodyGroupState = {
      ...state,
      activeProposal: {
        ...activeProposal,
        comments: [
          {
            id: "comment-1",
            proposalId: "proposal-1",
            authorParentId: "parent-a",
            date: "2026-03-03",
            body: "Can we swap this date?",
            createdAt: "2026-05-16T00:00:00.000Z",
            updatedAt: "2026-05-16T00:00:00.000Z",
          },
        ],
      },
    };

    render(
      <SharedCalendarApp
        state={stateWithComment}
        currentParentId="parent-b"
        acceptProposalAction={jest.fn()}
      />
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByTestId("proposal-comment-indicator")).toBeInTheDocument();
  });

  it("shows proposal comments when a commented proposal date is selected", () => {
    const activeProposal = createActiveProposal({
      ...state.agreedCalendar.scheduleData,
      overrides: [{ date: "2026-03-02", labelId: "dad" }],
    });
    const stateWithComment: CustodyGroupState = {
      ...state,
      activeProposal: {
        ...activeProposal,
        comments: [
          {
            id: "comment-1",
            proposalId: "proposal-1",
            authorParentId: "parent-a",
            date: "2026-03-03",
            body: "Can we swap this date?",
            createdAt: "2026-05-16T00:00:00.000Z",
            updatedAt: "2026-05-16T00:00:00.000Z",
          },
        ],
      },
    };

    render(
      <SharedCalendarApp
        state={stateWithComment}
        currentParentId="parent-b"
        acceptProposalAction={jest.fn()}
      />
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });
    fireEvent.click(screen.getByRole("button", { name: "2026-03-03" }));

    expect(screen.getByText("Can we swap this date?")).toBeInTheDocument();
  });

  it("lets the receiver edit and send a counterproposal", () => {
    const proposedScheduleData = {
      ...state.agreedCalendar.scheduleData,
      overrides: [{ date: "2026-03-02", labelId: "dad" }],
    };
    const stateWithActiveProposal: CustodyGroupState = {
      ...state,
      activeProposal: createActiveProposal(proposedScheduleData),
    };

    render(
      <SharedCalendarApp
        state={stateWithActiveProposal}
        currentParentId="parent-b"
        counterProposalAction={jest.fn()}
      />
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText("Review Proposal")).toBeInTheDocument();
    expect(screen.queryByText("Schedule Editor")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit Counter" }));

    expect(screen.getByText("Schedule Editor")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send Counter" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Accept Proposal" })
    ).not.toBeInTheDocument();
    expect(
      document.querySelector<HTMLInputElement>('input[name="proposalId"]')
        ?.value
    ).toBe("proposal-1");
    expect(
      document.querySelector<HTMLInputElement>('input[name="revisionId"]')
        ?.value
    ).toBe("revision-1");
    expect(
      document.querySelector<HTMLInputElement>('input[name="scheduleData"]')
        ?.value
    ).toContain('"date":"2026-03-02"');
  });

  it("renders an active proposal for sender withdrawal", () => {
    const stateWithActiveProposal: CustodyGroupState = {
      ...state,
      activeProposal: createActiveProposal(),
    };

    render(
      <SharedCalendarApp
        state={stateWithActiveProposal}
        currentParentId="parent-a"
        withdrawProposalAction={jest.fn()}
      />
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText("Sent Proposal")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Withdraw Proposal" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Schedule Editor")).not.toBeInTheDocument();
  });
});
