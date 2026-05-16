import { render, screen } from "@testing-library/react";
import { ProposalWorkspace } from "./ProposalWorkspace";
import type { ScheduleData } from "@/lib/scheduleTypes";

const labels = [
  { id: "mom", name: "Mom", color: "#bbf7d0" },
  { id: "dad", name: "Dad", color: "#fef08a" },
];

const agreedScheduleData: ScheduleData = {
  labels,
  schedules: [
    {
      id: "schedule-1",
      startDate: "2026-03-02",
      cycleWeeks: 1,
      labelIds: ["mom", "dad"],
    },
  ],
  overrides: [],
};

describe("ProposalWorkspace", () => {
  it("renders proposed calendar with changed date markers", () => {
    const proposedScheduleData: ScheduleData = {
      ...agreedScheduleData,
      overrides: [{ date: "2026-03-02", labelId: "dad" }],
    };

    render(
      <ProposalWorkspace
        today={new Date(2026, 2, 1)}
        agreedScheduleData={agreedScheduleData}
        proposedScheduleData={proposedScheduleData}
        onUpdateProposedScheduleData={jest.fn()}
      />
    );

    expect(screen.getByText("Draft Proposal")).toBeInTheDocument();
    expect(screen.getByTestId("proposal-change-indicator")).toBeInTheDocument();
  });

  it("does not render changed markers when proposed data matches agreed data", () => {
    render(
      <ProposalWorkspace
        today={new Date(2026, 2, 1)}
        agreedScheduleData={agreedScheduleData}
        proposedScheduleData={agreedScheduleData}
        onUpdateProposedScheduleData={jest.fn()}
      />
    );

    expect(
      screen.queryByTestId("proposal-change-indicator")
    ).not.toBeInTheDocument();
  });

  it("renders shared note and proposal comment indicators", () => {
    render(
      <ProposalWorkspace
        today={new Date(2026, 2, 1)}
        agreedScheduleData={agreedScheduleData}
        proposedScheduleData={agreedScheduleData}
        noteDateKeys={new Set(["2026-03-02"])}
        commentDateKeys={new Set(["2026-03-03"])}
        onUpdateProposedScheduleData={jest.fn()}
      />
    );

    expect(screen.getByTestId("shared-note-indicator")).toBeInTheDocument();
    expect(screen.getByTestId("proposal-comment-indicator")).toBeInTheDocument();
  });
});
