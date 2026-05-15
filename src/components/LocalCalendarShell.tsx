"use client";

import { useEffect, useMemo, useState } from "react";
import { LocalCalendarApp } from "./LocalCalendarApp";

export function LocalCalendarShell() {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setToday(new Date()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return useMemo(() => {
    if (!today) return null;
    return <LocalCalendarApp today={today} />;
  }, [today]);
}
