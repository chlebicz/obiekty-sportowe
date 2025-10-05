export const dayNames: { [k: number]: string } = {
  1: 'poniedziałek',
  2: 'wtorek',
  3: 'środa',
  4: 'czwartek',
  5: 'piątek',
  6: 'sobota',
  7: 'niedziela',
};

function toSeconds(time: string): number {
  const [h, m, s] = time.split(':').map(s => parseInt(s));
  return h * 3600 + m * 60 + s;
}

export function isInTimeRange(date: Date, range: string): boolean {
  const [startStr, endStr] = range.split('-');

  const rangeStart = toSeconds(startStr);
  const rangeEnd = toSeconds(endStr);

  const current =
    date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();

  return current >= rangeStart && current <= rangeEnd;
}