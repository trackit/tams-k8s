import { describe, expect, it } from 'vitest';
import { parseTimerange, formatTimerange, timerangesOverlap, intersectTimeranges } from './timerange';

describe('timerange utilities', () => {
  describe('parseTimerange', () => {
    it('should parse standard range [0:0_10:0)', () => {
      const result = parseTimerange('[0:0_10:0)');
      expect(result).toEqual({
        start: 0,
        end: 10_000_000_000,
        startInclusive: true,
        endInclusive: false,
      });
    });

    it('should parse range extending to infinity (5:0_', () => {
      const result = parseTimerange('(5:0_');
      expect(result).toEqual({
        start: 5_000_000_000,
        end: Infinity,
        startInclusive: false,
        endInclusive: true,
      });
    });

    it('should parse range extending from negative infinity _10:0]', () => {
      const result = parseTimerange('_10:0]');
      expect(result).toEqual({
        start: -Infinity,
        end: 10_000_000_000,
        startInclusive: true,
        endInclusive: true,
      });
    });

    it('should parse single timestamp [10:0]', () => {
      const result = parseTimerange('[10:0]');
      expect(result).toEqual({
        start: 10_000_000_000,
        end: 10_000_000_000,
        startInclusive: true,
        endInclusive: true,
      });
    });

    it('should parse eternal range _', () => {
      const result = parseTimerange('_');
      expect(result).toEqual({
        start: -Infinity,
        end: Infinity,
        startInclusive: true,
        endInclusive: true,
      });
    });

    it('should parse empty range ()', () => {
      const result = parseTimerange('()');
      expect(result).toEqual({
        start: 0,
        end: 0,
        startInclusive: false,
        endInclusive: false,
      });
    });

    it('should parse negative timestamps [-5:500_10:0]', () => {
      const result = parseTimerange('[-5:500_10:0]');
      expect(result).toEqual({
        start: -5_000_000_500,
        end: 10_000_000_000,
        startInclusive: true,
        endInclusive: true,
      });
    });
  });

  describe('formatTimerange', () => {
    it('should format standard range', () => {
      const result = formatTimerange({
        start: 0,
        end: 10_000_000_000,
        startInclusive: true,
        endInclusive: false,
      });
      expect(result).toBe('[0:0_10:0)');
    });

    it('should format eternal range', () => {
      const result = formatTimerange({
        start: -Infinity,
        end: Infinity,
        startInclusive: true,
        endInclusive: true,
      });
      expect(result).toBe('_');
    });

    it('should format single timestamp', () => {
      const result = formatTimerange({
        start: 10_000_000_000,
        end: 10_000_000_000,
        startInclusive: true,
        endInclusive: true,
      });
      expect(result).toBe('[10:0]');
    });
  });
});
