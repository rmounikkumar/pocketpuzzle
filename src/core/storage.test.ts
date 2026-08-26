import { describe, expect, it } from 'vitest';
import {
  loadBest,
  loadClassicBest,
  loadDailyBest,
  loadDifficulty,
  loadMode,
  pruneDaily
} from './storage';

describe('storage fallback', () => {
  it('returns defaults and never throws without localStorage', () => {
    expect(() => loadBest()).not.toThrow();
    expect(loadBest()).toBe(0);
    expect(loadMode()).toBe('classic');
    expect(loadDifficulty()).toBe('normal');
    expect(loadClassicBest('easy')).toBe(0);
    expect(loadClassicBest('normal')).toBe(0);
    expect(loadClassicBest('hard')).toBe(0);
    expect(loadDailyBest('2026-08-26', 'normal')).toBe(0);
  });
});

describe('pruneDaily', () => {
  it('keeps only the most recent keys across difficulties', () => {
    const entries: Record<string, number> = {
      '2026-08-24:normal': 300,
      '2026-08-26:hard': 900,
      '2026-08-25:easy': 600,
      '2026-08-20:normal': 100
    };
    const pruned = pruneDaily(entries, 2);
    expect(Object.keys(pruned)).toEqual(['2026-08-26:hard', '2026-08-25:easy']);
    expect(pruned['2026-08-26:hard']).toBe(900);
  });

  it('returns everything when under the limit', () => {
    const entries = { '2026-08-26:normal': 10 };
    expect(pruneDaily(entries, 30)).toEqual(entries);
  });

  it('handles an empty map', () => {
    expect(pruneDaily({}, 5)).toEqual({});
  });
});
