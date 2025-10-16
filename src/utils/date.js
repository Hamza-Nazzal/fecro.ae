// utils/date.js (or inline in the same file)

// 14 Oct 2025 style (day–month–year)
export function formatDMY(date, locale = "en-GB") {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function addDays(dateLike, days = 14) {
  const d = dateLike instanceof Date ? new Date(dateLike) : new Date(dateLike);
  d.setDate(d.getDate() + days);
  return d;
}