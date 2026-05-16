import { fireEvent, render, screen } from "@testing-library/react";
import { saveScheduleData } from "@/lib/storage";
import type { ScheduleData } from "@/lib/scheduleTypes";
import { useLocalScheduleState } from "./useLocalScheduleState";

const agreedScheduleData: ScheduleData = {
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
};

type LocalScheduleState = ReturnType<typeof useLocalScheduleState>;

function LocalScheduleStateHarness({
  onRender,
}: {
  onRender: (state: LocalScheduleState) => void;
}) {
  const state = useLocalScheduleState();
  onRender(state);

  return (
    <>
      <button type="button" onClick={state.startDraft}>
        Start Draft
      </button>
      <button type="button" onClick={state.applyDraftLocally}>
        Apply Draft
      </button>
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
  saveScheduleData(agreedScheduleData);
});

describe("useLocalScheduleState", () => {
  it("clones the draft when applying it to the agreed calendar", () => {
    let latestState: LocalScheduleState | null = null;
    render(
      <LocalScheduleStateHarness
        onRender={(state) => {
          latestState = state;
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Start Draft" }));
    const draftReference = latestState?.draftScheduleData;

    fireEvent.click(screen.getByRole("button", { name: "Apply Draft" }));

    expect(latestState?.agreedScheduleData).toEqual(draftReference);
    expect(latestState?.agreedScheduleData).not.toBe(draftReference);
  });
});
