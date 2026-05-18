export const NORWAY_TIME_ZONE = "Europe/Oslo";

const norwayDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: NORWAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const norwayOffsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: NORWAY_TIME_ZONE,
  timeZoneName: "shortOffset",
});

function getNorwayOffsetMs(date: Date): number {
  const offsetPart = norwayOffsetFormatter
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = offsetPart?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);

  if (!match) {
    throw new Error(`Unable to determine Norway time offset for ${date}`);
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");
  return sign * (hours * 60 + minutes) * 60 * 1000;
}

export function formatDateKey(date: Date): string {
  const parts = norwayDateFormatter.formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

export function parseDateKey(key: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    throw new Error(`Invalid date key: ${key}`);
  }
  const [y, m, d] = key.split("-").map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d);
  const date = new Date(utcMidnight - getNorwayOffsetMs(new Date(utcMidnight)));
  if (
    formatDateKey(date) !== key ||
    new Date(Date.UTC(y, m - 1, d)).getUTCDate() !== d
  ) {
    throw new Error(`Invalid date key: ${key}`);
  }
  return date;
}
