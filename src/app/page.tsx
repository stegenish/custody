"use client";

import { useEffect, useMemo, useState } from "react";
import { LocalCalendarApp } from "@/components/LocalCalendarApp";

export default function Home() {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setToday(new Date()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const workspace = useMemo(() => {
    if (!today) return null;
    return <LocalCalendarApp today={today} />;
  }, [today]);

  return workspace;
}
