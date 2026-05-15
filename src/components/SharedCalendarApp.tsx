"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarWorkspace } from "./CalendarWorkspace";
import type { CustodyGroupState } from "@/lib/sharedCalendarTypes";

interface SharedCalendarAppProps {
  state: CustodyGroupState;
}

export function SharedCalendarApp({ state }: SharedCalendarAppProps) {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setToday(new Date()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return useMemo(() => {
    if (!today) return null;
    return (
      <CalendarWorkspace
        title="Custody Calendar"
        today={today}
        scheduleData={state.agreedCalendar.scheduleData}
        readOnly
        onUpdateScheduleData={() => undefined}
      />
    );
  }, [state.agreedCalendar.scheduleData, today]);
}
