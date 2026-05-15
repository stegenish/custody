"use client";

import { type ReactNode, useMemo, useState } from "react";
import { CalendarGrid } from "@/components/CalendarGrid";
import { DayOverrideBar } from "@/components/DayOverrideBar";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import {
  type CalendarMonth,
  generateCalendar,
  getCalendarVisibleRange,
} from "@/lib/dateUtils";
import { buildColorMap } from "@/lib/scheduleResolver";
import { removeDayOverride, setDayOverride } from "@/lib/scheduleMutations";
import type { ScheduleData } from "@/lib/scheduleTypes";

interface CalendarWorkspaceProps {
  title: string;
  today: Date;
  calendar?: CalendarMonth[];
  scheduleData: ScheduleData;
  changedDateKeys?: Set<string>;
  toolbar?: ReactNode;
  readOnly?: boolean;
  onUpdateScheduleData: (data: ScheduleData) => void;
}

export function CalendarWorkspace({
  title,
  today,
  calendar,
  scheduleData,
  changedDateKeys,
  toolbar,
  readOnly = false,
  onUpdateScheduleData,
}: CalendarWorkspaceProps) {
  const generatedCalendar = useMemo(() => generateCalendar(today), [today]);
  const visibleCalendar = calendar ?? generatedCalendar;
  const colorMap = useMemo(() => {
    const { firstDay, lastDay } = getCalendarVisibleRange(visibleCalendar);
    return buildColorMap(firstDay, lastDay, scheduleData);
  }, [visibleCalendar, scheduleData]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDayColor = selectedDate ? colorMap.get(selectedDate) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        {title}
      </h1>
      {toolbar}
      {!readOnly && (
        <ScheduleEditor
          scheduleData={scheduleData}
          onUpdateScheduleData={onUpdateScheduleData}
        />
      )}
      <CalendarGrid
        months={visibleCalendar}
        colorMap={colorMap}
        changedDateKeys={changedDateKeys}
        onDayClick={readOnly ? undefined : setSelectedDate}
      />
      {!readOnly && selectedDate && (
        <DayOverrideBar
          dateKey={selectedDate}
          currentLabelId={selectedDayColor?.label.id ?? null}
          isOverride={selectedDayColor?.isOverride ?? false}
          labels={scheduleData.labels}
          onSetOverride={(date, labelId) =>
            onUpdateScheduleData(setDayOverride(scheduleData, date, labelId))
          }
          onRemoveOverride={(date) =>
            onUpdateScheduleData(removeDayOverride(scheduleData, date))
          }
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
