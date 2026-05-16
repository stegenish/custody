"use client";

import { LocalCalendarApp } from "./LocalCalendarApp";
import { useClientToday } from "./useClientToday";

export function LocalCalendarShell() {
  const today = useClientToday();

  if (!today) return null;
  return <LocalCalendarApp today={today} />;
}
