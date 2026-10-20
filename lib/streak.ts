export type HistoryDay = { activity_date: string; activities_completed: number; is_active: boolean };
export const STREAK_MILESTONES = [
  { days: 3, name: "Beginner Explorer" }, { days: 7, name: "Rising Adventurer" },
  { days: 14, name: "Dedicated Traveler" }, { days: 30, name: "Language Voyager" },
  { days: 60, name: "World Explorer" }, { days: 100, name: "Master Adventurer" },
  { days: 365, name: "Legendary Traveler" },
];
export function localDate(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map(type => parts.find(p => p.type === type)!.value).join("-");
}
export function shiftDay(date: string, delta: number) { const d = new Date(date + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + delta); return d.toISOString().slice(0, 10); }
export function shiftMonth(month: string, delta: number) { const d = new Date(month + "-01T12:00:00Z"); d.setUTCMonth(d.getUTCMonth() + delta); return d.toISOString().slice(0, 7); }
export function selectedMonth(value: string | undefined, today: string) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && value >= "1900-01" && value <= today.slice(0, 7) ? value : today.slice(0, 7);
}
export function monthCells(month: string) {
  const first = new Date(month + "-01T12:00:00Z");
  const length = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array(first.getUTCDay()).fill(null);
  for (let day = 1; day <= length; day++) cells.push(month + "-" + String(day).padStart(2, "0"));
  while (cells.length % 7) cells.push(null);
  return cells;
}
export function streakMetrics(history: HistoryDay[], frozen: string[], today: string) {
  const active = new Set(history.filter(d => d.is_active && d.activity_date <= today).map(d => d.activity_date));
  const freezes = new Set(frozen.filter(d => d <= today && !active.has(d)));
  const days = [...new Set([...active, ...freezes])].sort();
  let running = 0, longest = 0, previous: string | null = null;
  for (const date of days) {
    if (!previous || shiftDay(previous, 1) !== date) running = 0;
    if (active.has(date)) running++;
    longest = Math.max(longest, running); previous = date;
  }
  let cursor = active.has(today) ? today : shiftDay(today, -1), current = 0;
  while (active.has(cursor) || freezes.has(cursor)) { if (active.has(cursor)) current++; cursor = shiftDay(cursor, -1); }
  return { current, longest, active: [...active], frozen: [...freezes], practicedToday: active.has(today) };
}
export function missingFeature(error: { code?: string } | null) { return Boolean(error && ["42P01", "PGRST205", "PGRST202"].includes(error.code ?? "")); }

export function nextLocalMidnight(now:Date,timezone:string) {
  const today=localDate(now,timezone);
  let low=now.getTime(),high=low+48*60*60*1000;
  while(high-low>1) {const middle=Math.floor((low+high)/2);if(localDate(new Date(middle),timezone)>today)high=middle;else low=middle;}
  return new Date(high).toISOString();
}
