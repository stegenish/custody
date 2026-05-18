"use client";

import { useEffect, useState } from "react";

export function useClientToday(): Date | null {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    // Deferred so tests can advance fake timers before the first date commits.
    const timeoutId = window.setTimeout(() => setToday(new Date()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return today;
}
