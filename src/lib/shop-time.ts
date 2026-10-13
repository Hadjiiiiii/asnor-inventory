// "Today" and "this month" mean the shop's calendar, not the server's. Set SHOP_TIMEZONE (an IANA name such
// as "America/New_York") on the host; unset, the server's own zone is used, which is UTC on most hosts.
export const SHOP_TIMEZONE = process.env.SHOP_TIMEZONE || undefined;

const wallClock = (at: Date, timeZone?: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(at);
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: n("year"), month: n("month"), day: n("day"), hour: n("hour"), minute: n("minute"), second: n("second") };
};

/** The calendar day an instant falls on in the shop's zone; month is 1 to 12. */
export function shopDate(at: Date, timeZone: string | undefined = SHOP_TIMEZONE) {
  const { year, month, day } = wallClock(at, timeZone);
  return { year, month, day };
}

/**
 * The instant a shop-local calendar day begins. Month and day may overflow (month 0 is December of the
 * year before), the same way `new Date(y, m, d)` does.
 */
export function shopDayStart(
  year: number,
  month: number,
  day: number,
  timeZone: string | undefined = SHOP_TIMEZONE,
): Date {
  if (!timeZone) return new Date(year, month - 1, day);
  const wanted = Date.UTC(year, month - 1, day);
  let guess = wanted;
  // Two passes settle on the right offset even when a daylight-saving change falls between guess and answer.
  for (let pass = 0; pass < 2; pass++) {
    const w = wallClock(new Date(guess), timeZone);
    guess -= Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - wanted;
  }
  return new Date(guess);
}
