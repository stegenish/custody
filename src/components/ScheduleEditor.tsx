import { useState } from "react";
import type { ScheduleData } from "@/lib/scheduleTypes";
import {
  addLabel,
  updateLabel,
  deleteLabel,
  addSchedule,
  deleteSchedule,
} from "@/lib/scheduleMutations";
import { LabelManager } from "./LabelManager";
import { ScheduleList } from "./ScheduleList";

interface ScheduleEditorProps {
  scheduleData: ScheduleData;
  displayScheduleData?: ScheduleData;
  onUpdateScheduleData: (data: ScheduleData) => void;
  onUpdateLabelPreference?: (
    id: string,
    name: string,
    color: string
  ) => void;
}

export function ScheduleEditor({
  scheduleData,
  displayScheduleData,
  onUpdateScheduleData,
  onUpdateLabelPreference,
}: ScheduleEditorProps) {
  const visibleScheduleData = displayScheduleData ?? scheduleData;
  const hasLabels = visibleScheduleData.labels.length > 0;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <h2 className="text-sm font-semibold">Schedule Editor</h2>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs text-blue-600"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-4 p-4">
          {!hasLabels && (
            <p className="rounded bg-blue-50 p-2 text-sm text-blue-800">
              Get started by creating labels for each parent (e.g., &quot;Mom&quot; and &quot;Dad&quot;).
            </p>
          )}

          <LabelManager
            labels={visibleScheduleData.labels}
            onAddLabel={(name, color) =>
              onUpdateScheduleData(addLabel(scheduleData, name, color))
            }
            onUpdateLabel={(id, name, color) =>
              onUpdateLabelPreference
                ? onUpdateLabelPreference(id, name, color)
                : onUpdateScheduleData(
                    updateLabel(scheduleData, id, name, color)
                  )
            }
            onDeleteLabel={(id) =>
              onUpdateScheduleData(deleteLabel(scheduleData, id))
            }
          />

          <ScheduleList
            schedules={scheduleData.schedules}
            labels={visibleScheduleData.labels}
            onAddSchedule={(startDate, cycleWeeks, labelIds) =>
              onUpdateScheduleData(
                addSchedule(scheduleData, startDate, cycleWeeks, labelIds)
              )
            }
            onDeleteSchedule={(id) =>
              onUpdateScheduleData(deleteSchedule(scheduleData, id))
            }
          />
        </div>
      )}
    </div>
  );
}
