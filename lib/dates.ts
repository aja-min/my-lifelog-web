export function formatDate(date: string, weekday = true) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(weekday ? { weekday: "long" as const } : {}),
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${date}T12:00:00+09:00`));
}
export function todayTokyo() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function monthGrid(month: string) {
  const [year, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, m - 1, 1));
  const count = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const cells = Math.ceil((first.getUTCDay() + count) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => {
    const day = i - first.getUTCDay() + 1;
    return day > 0 && day <= count
      ? `${month}-${String(day).padStart(2, "0")}`
      : null;
  });
}
export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}
