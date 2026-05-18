import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
} from "react";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const firstLabelId = labels[0]?.id ?? null;

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement;
    return () => {
      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, []);

  useEffect(() => {
    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleDocumentKeyDown);
    return () =>
      document.removeEventListener("keydown", handleDocumentKeyDown);
  }, [onClose]);

  useEffect(() => {
    const currentButton = currentLabelId
      ? buttonRefs.current.get(currentLabelId)
      : null;
    const firstButton = firstLabelId
      ? buttonRefs.current.get(firstLabelId)
      : null;

    (currentButton ?? firstButton)?.focus();
  }, [currentLabelId, dateKey, firstLabelId]);

  return (
    <div
      data-testid="day-override-bar"
      role="dialog"
      aria-modal="true"
      aria-label={`Override ${dateKey}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        } else if (event.key === "Tab") {
          trapDialogFocus(event, dialogRef.current);
        }
      }}
      ref={dialogRef}
      className="fixed inset-x-0 bottom-0 z-50 max-h-[55vh] overflow-y-auto border-t border-gray-200 bg-white px-4 py-3 shadow-lg sm:max-h-none sm:overflow-visible"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-[1fr_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-center">
        <span className="text-sm font-semibold">{dateKey}</span>

        <button
          type="button"
          onClick={onClose}
          className="justify-self-end rounded px-3 py-2 text-sm text-gray-500 sm:order-last sm:ml-auto"
        >
          Close
        </button>

        <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1">
          {labels.map((label) => (
            <button
              key={label.id}
              type="button"
              ref={(element) => {
                if (element) {
                  buttonRefs.current.set(label.id, element);
                } else {
                  buttonRefs.current.delete(label.id);
                }
              }}
              aria-pressed={label.id === currentLabelId}
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
            type="button"
            onClick={() => onRemoveOverride(dateKey)}
            className="col-span-2 justify-self-start rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 sm:col-span-1"
          >
            Clear Override
          </button>
        )}
      </div>
    </div>
  );
}

function trapDialogFocus(
  event: ReactKeyboardEvent,
  dialog: HTMLDivElement | null
) {
  if (!dialog) return;
  const focusableElements = Array.from(
    dialog.querySelectorAll<HTMLElement>("button:not([disabled])")
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  if (!firstElement || !lastElement) return;

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}
