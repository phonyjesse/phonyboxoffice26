/**
 * Formats a calendar release date from the DB (YYYY-MM-DD) without shifting to the previous
 * calendar day in US timezones (plain `new Date("YYYY-MM-DD")` is parsed as UTC midnight).
 */
export function formatReleaseDate(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") {
    return "TBD";
  }
  const trimmed = String(value).trim();
  const dateOnly = trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const utc = new Date(`${dateOnly}T00:00:00.000Z`);
    if (Number.isNaN(utc.getTime())) {
      return "TBD";
    }
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(utc);
    } catch {
      return "TBD";
    }
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "TBD";
  }
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(parsed);
  } catch {
    return "TBD";
  }
}
