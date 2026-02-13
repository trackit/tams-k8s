import { TimerangeInterval, timerangeRegex } from '@tams-k8s/api';

/**
 * Parse a timerange string into a structured interval according to TAMS specification
 * Format: {start inclusivity}{start timestamp}_{end timestamp}{end inclusivity}
 * Timestamp format: {sign?}{seconds}:{nanoseconds}
 *
 * Examples:
 *   "[0:0_10:0)" -> { start: 0, end: 10000000000, startInclusive: true, endInclusive: false }
 *   "(5:0_" -> { start: 5000000000, end: Infinity, startInclusive: false, endInclusive: true }
 *   "[10:0]" -> { start: 10000000000, end: 10000000000, startInclusive: true, endInclusive: true }
 *   "_" -> { start: -Infinity, end: Infinity, startInclusive: true, endInclusive: true }
 *   "()" -> { start: 0, end: 0, startInclusive: false, endInclusive: false } (empty range)
 *   "[-5:500_10:0]" -> { start: -4999999500, end: 10000000000, startInclusive: true, endInclusive: true }
 */
export function parseTimerange(timerange: string): TimerangeInterval | null {
  const match = timerange.match(timerangeRegex);
  if (!match) return null;

  const startBracket = match[1];
  const firstTimestamp = match[2];
  const hasUnderscore = match[5] !== undefined;
  const secondTimestamp = match[6];
  const endBracket = match[9];

  // Helper function to parse a timestamp string to nanoseconds
  const parseTimestamp = (timestampStr: string): number => {
    const [secondsStr, nanosecondsStr] = timestampStr.split(':');
    const seconds = parseInt(secondsStr, 10);
    const nanoseconds = parseInt(nanosecondsStr, 10);

    if (isNaN(seconds) || isNaN(nanoseconds)) {
      throw new Error('Invalid timestamp');
    }

    // Convert to nanoseconds: seconds * 1e9 + nanoseconds
    // Handle negative seconds properly
    if (seconds < 0) {
      return seconds * 1_000_000_000 - nanoseconds;
    }
    return seconds * 1_000_000_000 + nanoseconds;
  };

  let start: number;
  let end: number;
  let startInclusive: boolean;
  let endInclusive: boolean;

  // Case 1: "_" - eternal range
  if (!firstTimestamp && hasUnderscore && !secondTimestamp) {
    return {
      start: -Infinity,
      end: Infinity,
      startInclusive: true,
      endInclusive: true,
    };
  }

  // Case 2: "()" - empty range
  if (!firstTimestamp && !hasUnderscore && startBracket && endBracket) {
    return {
      start: 0,
      end: 0,
      startInclusive: startBracket === '[',
      endInclusive: endBracket === ']',
    };
  }

  // Case 3: Single timestamp - "[10:0]"
  if (firstTimestamp && !hasUnderscore) {
    try {
      const timestamp = parseTimestamp(firstTimestamp);
      return {
        start: timestamp,
        end: timestamp,
        startInclusive: (startBracket || '[') === '[',
        endInclusive: (endBracket || ']') === ']',
      };
    } catch {
      return null;
    }
  }

  // Case 4: Range with start and/or end
  try {
    // Parse start timestamp or use -Infinity
    if (firstTimestamp) {
      start = parseTimestamp(firstTimestamp);
      startInclusive = (startBracket || '[') === '[';
    } else {
      start = -Infinity;
      startInclusive = true;
    }

    // Parse end timestamp or use Infinity
    if (secondTimestamp) {
      end = parseTimestamp(secondTimestamp);
      endInclusive = (endBracket || ']') === ']';
    } else {
      end = Infinity;
      endInclusive = true;
    }

    return { start, end, startInclusive, endInclusive };
  } catch {
    return null;
  }
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
 * Format a timerange interval back to string format according to TAMS specification
 * Format: {start inclusivity}{start timestamp}_{end timestamp}{end inclusivity}
 * Timestamp format: {sign?}{seconds}:{nanoseconds}
 */
export function formatTimerange(interval: TimerangeInterval): string {
  const startBracket = interval.startInclusive ? '[' : '(';
  const endBracket = interval.endInclusive ? ']' : ')';

  // Helper to format a timestamp from nanoseconds
  const formatTimestamp = (nanos: number): string => {
    if (!isFinite(nanos)) {
      return '';
    }

    const isNegative = nanos < 0;
    const absNanos = Math.abs(nanos);

    const seconds = Math.floor(absNanos / 1_000_000_000);
    const nanoseconds = absNanos % 1_000_000_000;

    const sign = isNegative ? '-' : '';
    return `${sign}${seconds}:${nanoseconds}`;
  };

  const startStr = formatTimestamp(interval.start);
  const endStr = formatTimestamp(interval.end);

  // Handle special cases
  // Eternal range: "_"
  if (startStr === '' && endStr === '') {
    return '_';
  }

  // Empty range: "()" or "[]"
  if (interval.start === interval.end && interval.start === 0 && !interval.startInclusive && !interval.endInclusive) {
    return '()';
  }

  // Single timestamp: "[10:0]" or "(10:0)"
  if (startStr === endStr && startStr !== '') {
    return `${startBracket}${startStr}${endBracket}`;
  }

  // Range extending to negative infinity: "_10:0]"
  if (startStr === '') {
    return `_${endStr}${endBracket}`;
  }

  // Range extending to positive infinity: "[10:0_"
  if (endStr === '') {
    return `${startBracket}${startStr}_`;
  }

  // Normal range: "[0:0_10:0)"
  return `${startBracket}${startStr}_${endStr}${endBracket}`;
}
