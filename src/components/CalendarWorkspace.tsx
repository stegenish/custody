"use client";

import { type ReactNode, useMemo, useState } from "react";
import { CalendarGrid } from "@/components/CalendarGrid";
import { DayOverrideBar } from "@/components/DayOverrideBar";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import { generateCalendar } from "@/lib/dateUtils";
import { buildColorMap } from "@/lib/scheduleResolver";
import { removeDayOverride, setDayOverride } from "@/lib/scheduleMutations";
import type { ScheduleData } from "@/lib/scheduleTypes";

interface CalendarWorkspaceProps {
  title: string;
  today: Date;
  scheduleData: ScheduleData;
  changedDateKeys?: Set<string>;
  toolbar?: ReactNode;
  onUpdateScheduleData: (data: ScheduleData) => void;
}

function getCalendarBounds(calendar: ReturnType<typeof generateCalendar>): {
  firstDay: Date;
  lastDay: Date;
} {
  const firstDay = calendar[0].weeks[0].days[0].date;
  const lastMonth = calendar[calendar.length - 1];
  const lastWeek = lastMonth.weeks[lastMonth.weeks.length - 1];
  const lastDay = lastWeek.days[6].date;
  return { firstDay, lastDay };
}

export function CalendarWorkspace({
  title,
  today,
  scheduleData,
  changedDateKeys,
  toolbar,
  onUpdateScheduleData,
}: CalendarWorkspaceProps) {
  const calendar = useMemo(() => generateCalendar(today), [today]);
  const colorMap = useMemo(() => {
    const { firstDay, lastDay } = getCalendarBounds(calendar);
    return buildColorMap(firstDay, lastDay, scheduleData);
  }, [calendar, scheduleData]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDayColor = selectedDate ? colorMap.get(selectedDate) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        {title}
      </h1>
      {toolbar}
      <ScheduleEditor
        scheduleData={scheduleData}
        onUpdateScheduleData={onUpdateScheduleData}
      />
      <CalendarGrid
        months={calendar}
        colorMap={colorMap}
        changedDateKeys={changedDateKeys}
        onDayClick={setSelectedDate}
      />
      {selectedDate && selectedDayColor && (
        <DayOverrideBar
          dateKey={selectedDate}
          currentLabelId={selectedDayColor.label.id}
          isOverride={selectedDayColor.isOverride}
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
