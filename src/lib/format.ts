/**
 * Display formatters shared by the driver pages.
 *
 * Money, distance and freshness are formatted the same way everywhere, so a
 * rate on a search card reads identically to the same rate on a facility page.
 *
 * The currency symbol lives here because it is shown in a dozen places: change
 * it once and the whole app follows. ParkEasy prices a space in the local
 * currency, and the symbol is the only place that says which.
 */

/** The currency symbol used for every rate in the app. */
export const CURRENCY = '$';

/**
 * A money amount, e.g. `30` -> `$30` and `12.5` -> `$12.50`.
 *
 * A missing amount reads as a dash rather than `$0`, because "$0" is a claim
 * and "no price" is the truth.
 */
export function formatMoney(amount: number | null | undefined, decimals = 0): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return '-';
  return `${CURRENCY}${amount.toFixed(decimals)}`;
}

/**
 * An hourly rate with its unit, e.g. `$30/hour`.
 *
 * A facility with no published rate says so: the search treats an unpublished
 * rate as "unknown", not as free.
 */
export function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return 'Rate not published';
  return `${formatMoney(rate)}/hour`;
}

/**
 * A distance in metres, in metres below a kilometre and in kilometres above
 * it. A missing distance reads as "Unknown" rather than a misleading "0 m".
 */
export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined || !Number.isFinite(meters)) return 'Unknown';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

/**
 * How long ago a timestamp was, e.g. "just now", "4 min ago", "2 h ago", and
 * a plain date once it is older than a day.
 *
 * Availability numbers carry the moment they were read, so a driver can tell a
 * fresh count from a stale one.
 */
export function formatFreshness(iso: string | null | undefined): string {
  if (!iso) return 'unknown';
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return 'unknown';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(then).toLocaleDateString();
}

/** A booking or session timestamp in the browser's local time. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const value = Date.parse(iso);
  if (Number.isNaN(value)) return '-';
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** A duration in minutes as `2 h 30 min`, `45 min` or `-`. */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return '-';
  const whole = Math.max(0, Math.round(minutes));
  if (whole < 60) return `${whole} min`;
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
