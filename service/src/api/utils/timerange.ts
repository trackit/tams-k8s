import { TimerangeInterval, timerangeRegex } from '@tams-k8s/api';

/**
 * Parse a timerange string into a structured interval
 * Examples:
 *   "[1000:2000]" -> { start: 1000, end: 2000, startInclusive: true, endInclusive: true }
 *   "(1000:2000)" -> { start: 1000, end: 2000, startInclusive: false, endInclusive: false }
 *   "1000:2000" -> { start: 1000, end: 2000, startInclusive: true, endInclusive: true }
 */
export function parseTimerange(timerange: string): TimerangeInterval | null {
  const match = timerange.match(timerangeRegex);
  if (!match) return null;

  const startBracket = match[1] || '[';
  const firstInterval = match[2];
  const endBracket = match[8] || ']';

  if (!firstInterval) return null;

  const [startStr, endStr] = firstInterval.split(':');
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);

  if (isNaN(start) || isNaN(end)) return null;

  return {
    start,
    end,
    startInclusive: startBracket === '[',
    endInclusive: endBracket === ']',
  };
}

/**
 * Check if two timerange intervals overlap
 * Uses "ANY overlap" logic - returns true if intervals have any overlap
 */
export function timerangesOverlap(
  interval1: TimerangeInterval,
  interval2: TimerangeInterval
): boolean {
  let startComparison: boolean;
  let endComparison: boolean;

  if (interval1.startInclusive && interval2.endInclusive) {
    startComparison = interval1.start <= interval2.end;
  } else {
    startComparison = interval1.start < interval2.end;
  }

  if (interval2.startInclusive && interval1.endInclusive) {
    endComparison = interval2.start <= interval1.end;
  } else {
    endComparison = interval2.start < interval1.end;
  }

  return startComparison && endComparison;
}

/**
 * Intersect two timerange intervals
 * Returns the overlapping portion as a new interval, or null if no overlap
 */
export function intersectTimeranges(
  interval1: TimerangeInterval,
  interval2: TimerangeInterval
): TimerangeInterval | null {
  if (!timerangesOverlap(interval1, interval2)) return null;

  const start = Math.max(interval1.start, interval2.start);
  const end = Math.min(interval1.end, interval2.end);

  let startInclusive = true;
  let endInclusive = true;

  if (start === interval1.start) {
    startInclusive = interval1.startInclusive;
  }
  if (start === interval2.start) {
    startInclusive = startInclusive && interval2.startInclusive;
  }

  if (end === interval1.end) {
    endInclusive = interval1.endInclusive;
  }
  if (end === interval2.end) {
    endInclusive = endInclusive && interval2.endInclusive;
  }

  return { start, end, startInclusive, endInclusive };
}

/**
 * Format a timerange interval back to string format
 */
export function formatTimerange(interval: TimerangeInterval): string {
  const startBracket = interval.startInclusive ? '[' : '(';
  const endBracket = interval.endInclusive ? ']' : ')';
  return `${startBracket}${interval.start}:${interval.end}${endBracket}`;
}
