import type { CustodyLabel } from "@/lib/scheduleTypes";

interface DayOverrideBarProps {
  dateKey: string;
  currentLabelId: string | null;
  isOverride: boolean;
  labels: CustodyLabel[];
  onSetOverride: (dateKey: string, labelId: string) => void;
  onRemoveOverride: (dateKey: string) => void;
  onClose: () => void;
}

export function DayOverrideBar({
  dateKey,
  currentLabelId,
  isOverride,
  labels,
  onSetOverride,
  onRemoveOverride,
  onClose,
}: DayOverrideBarProps) {
  return (
    <div
      data-testid="day-override-bar"
      className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white px-4 py-3 shadow-lg"
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3">
        <span className="text-sm font-semibold">{dateKey}</span>

        <div className="flex gap-2">
          {labels.map((label) => (
            <button
              key={label.id}
              onClick={() => onSetOverride(dateKey, label.id)}
              className={`rounded px-3 py-2 text-sm ${
                label.id === currentLabelId
                  ? "ring-2 ring-blue-600 font-bold"
                  : ""
              }`}
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </button>
          ))}
        </div>

        {isOverride && (
          <button
            onClick={() => onRemoveOverride(dateKey)}
            className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700"
          >
            Clear Override
          </button>
        )}

        <button
          onClick={onClose}
          className="ml-auto rounded px-3 py-2 text-sm text-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  );
}
