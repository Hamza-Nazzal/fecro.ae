// utils/date.js (or inline in the same file)

// 14 Oct 2025 style (day–month–year)
export function formatDMY(date, locale = "en-GB") {
  const d = date instanceof Date ? date : new Date(date);
  return d
    .toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })
    .replace(",", "");
}

export function addDays(dateLike, days = 14) {
  const d = dateLike instanceof Date ? new Date(dateLike) : new Date(dateLike);
  d.setDate(d.getDate() + days);
  return d;
}