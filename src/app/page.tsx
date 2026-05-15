"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarGrid } from "@/components/CalendarGrid";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import { DayOverrideBar } from "@/components/DayOverrideBar";
import { generateCalendar } from "@/lib/dateUtils";
import { loadScheduleData, saveScheduleData } from "@/lib/storage";
import { buildColorMap } from "@/lib/scheduleResolver";
import { setDayOverride, removeDayOverride } from "@/lib/scheduleMutations";
import type { ScheduleData } from "@/lib/scheduleTypes";

export default function Home() {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setToday(new Date()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const calendar = useMemo(
    () => (today ? generateCalendar(today) : null),
    [today]
  );

  const [scheduleData, setScheduleData] = useState<ScheduleData>(() =>
    loadScheduleData()
  );

  // Persist on change (skip initial render)
  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    saveScheduleData(scheduleData);
  }, [scheduleData]);

  const colorMap = useMemo(() => {
    if (!calendar) return new Map();
    const firstDay = calendar[0].weeks[0].days[0].date;
    const lastMonth = calendar[calendar.length - 1];
    const lastWeek = lastMonth.weeks[lastMonth.weeks.length - 1];
    const lastDay = lastWeek.days[6].date;
    return buildColorMap(firstDay, lastDay, scheduleData);
  }, [calendar, scheduleData]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedDayColor = selectedDate ? colorMap.get(selectedDate) : null;

  if (!calendar) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        Custody Calendar
      </h1>
      <ScheduleEditor
        scheduleData={scheduleData}
        onUpdateScheduleData={setScheduleData}
      />
      <CalendarGrid
        months={calendar}
        colorMap={colorMap}
        onDayClick={setSelectedDate}
      />
      {selectedDate && selectedDayColor && (
        <DayOverrideBar
          dateKey={selectedDate}
          currentLabelId={selectedDayColor.label.id}
          isOverride={selectedDayColor.isOverride}
          labels={scheduleData.labels}
          onSetOverride={(date, labelId) =>
            setScheduleData(setDayOverride(scheduleData, date, labelId))
          }
          onRemoveOverride={(date) =>
            setScheduleData(removeDayOverride(scheduleData, date))
          }
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
