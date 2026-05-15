import { useState } from "react";
import type { CustodyLabel, CustodySchedule } from "@/lib/scheduleTypes";
import { validateSchedule } from "@/lib/scheduleMutations";

interface ScheduleListProps {
  schedules: CustodySchedule[];
  labels: CustodyLabel[];
  onAddSchedule: (
    startDate: string,
    cycleWeeks: 1 | 2 | 3,
    labelIds: [string, string]
  ) => void;
  onDeleteSchedule: (id: string) => void;
}

function labelName(id: string, labels: CustodyLabel[]): string {
  return labels.find((l) => l.id === id)?.name ?? "?";
}

export function ScheduleList({
  schedules,
  labels,
  onAddSchedule,
  onDeleteSchedule,
}: ScheduleListProps) {
  const [startDate, setStartDate] = useState("");
  const [cycleWeeks, setCycleWeeks] = useState<1 | 2 | 3>(2);
  const [labelA, setLabelA] = useState("");
  const [labelB, setLabelB] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasEnoughLabels = labels.length >= 2;

  // Default dropdowns to first two labels when available
  const effectiveLabelA = labelA || labels[0]?.id || "";
  const effectiveLabelB = labelB || labels[1]?.id || "";

  function handleAdd() {
    if (!startDate || !effectiveLabelA || !effectiveLabelB) return;
    const validationError = validateSchedule(
      startDate,
      cycleWeeks,
      [effectiveLabelA, effectiveLabelB],
      labels
    );
    if (validationError) {
      setError(validationError);
      return;
    }
    onAddSchedule(startDate, cycleWeeks, [effectiveLabelA, effectiveLabelB]);
    setStartDate("");
    setError(null);
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">Schedules</h3>

      <ul className="mb-3 space-y-1">
        {schedules.map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-sm">
            <span>{s.startDate}</span>
            <span className="text-gray-500">
              {s.cycleWeeks}w cycle
            </span>
            <span>
              {labelName(s.labelIds[0], labels)} / {labelName(s.labelIds[1], labels)}
            </span>
            <button
              type="button"
              onClick={() => onDeleteSchedule(s.id)}
              className="text-xs text-red-600"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {!hasEnoughLabels ? (
        <p className="text-sm text-gray-500">
          Create at least 2 labels before adding a schedule.
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="ml-1 rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm">
            Cycle
            <select
              value={cycleWeeks}
              onChange={(e) => setCycleWeeks(Number(e.target.value) as 1 | 2 | 3)}
              className="ml-1 rounded border px-2 py-1 text-sm"
            >
              <option value={1}>1 week</option>
              <option value={2}>2 weeks</option>
              <option value={3}>3 weeks</option>
            </select>
          </label>
          <label className="text-sm">
            Label A
            <select
              value={effectiveLabelA}
              onChange={(e) => setLabelA(e.target.value)}
              className="ml-1 rounded border px-2 py-1 text-sm"
            >
              {labels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Label B
            <select
              value={effectiveLabelB}
              onChange={(e) => setLabelB(e.target.value)}
              className="ml-1 rounded border px-2 py-1 text-sm"
            >
              {labels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleAdd}
            className="rounded bg-green-600 px-3 py-1 text-xs text-white"
          >
            Add Schedule
          </button>
          {error && (
            <p className="basis-full text-sm text-red-700">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
