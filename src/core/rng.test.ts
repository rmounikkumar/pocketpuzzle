import { describe, expect, it } from 'vitest';
import { dailyNumber, localDateKey, mulberry32, seedFromKey } from './rng';

describe('mulberry32', () => {
  it('produces the same sequence for the same seed', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = Array.from({ length: 8 }, () => a());
    const seqB = Array.from({ length: 8 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(Array.from({ length: 4 }, () => a())).not.toEqual(
      Array.from({ length: 4 }, () => b())
    );
  });

  it('always returns values within [0, 1)', () => {
    const r = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('localDateKey', () => {
  it('formats as YYYY-MM-DD from local date parts', () => {
    expect(localDateKey(new Date(2026, 7, 26))).toBe('2026-08-26');
    expect(localDateKey(new Date(2026, 0, 3))).toBe('2026-01-03');
  });
});

describe('seedFromKey', () => {
  it('is deterministic and key-sensitive', () => {
    expect(seedFromKey('2026-08-26')).toBe(seedFromKey('2026-08-26'));
    expect(seedFromKey('2026-08-26')).not.toBe(seedFromKey('2026-08-27'));
  });
});

describe('dailyNumber', () => {
  it('counts days since epoch', () => {
    expect(dailyNumber('1970-01-02')).toBe(1);
    expect(dailyNumber('2024-01-01')).toBe(19723);
  });
});
