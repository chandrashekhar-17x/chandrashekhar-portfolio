/** "What is Chandrashekhar probably doing right now?" from the time in Hyderabad. */

const ZONE = 'Asia/Kolkata';

// [first hour, status]; hours 0–23 in IST.
const DAY: readonly [number, string][] = [
  [0, 'asleep (the AI agent isn’t)'],
  [7, 'on coffee and code review'],
  [10, 'deep in Angular'],
  [14, 'building complex UIs'],
  [19, 'learning AI engineering'],
  [22, 'shipping side projects'],
];

export function hyderabadNow(date: Date): { time: string; status: string } {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  const hour = Number(time.slice(0, 2)) % 24;
  const status = DAY.filter(([from]) => hour >= from).at(-1)?.[1] ?? DAY[0]?.[1] ?? '';
  return { time, status };
}
