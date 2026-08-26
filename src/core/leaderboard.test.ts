import { describe, expect, it } from 'vitest';
import { getLeaderboard, addScore, clearLeaderboard, isHighScore } from './leaderboard';

describe('leaderboard storage', () => {
  it('starts empty', () => {
    expect(getLeaderboard()).toEqual([]);
  });

  it('isHighScore returns true for any positive score on empty board', () => {
    expect(isHighScore(100)).toBe(true);
    expect(isHighScore(1)).toBe(true);
  });

  it('isHighScore returns false for zero', () => {
    expect(isHighScore(0)).toBe(false);
  });

  it('isHighScore returns false for negative', () => {
    expect(isHighScore(-10)).toBe(false);
  });

  it('addScore and getLeaderboard work with localStorage available', () => {
    const store: Record<string, string> = {};
    const mock = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; }
    };
    const orig = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', { value: mock, writable: true, configurable: true });

    try {
      addScore({ score: 200, difficulty: 'easy', mode: 'daily', date: '2026-08-01' });
      addScore({ score: 100, difficulty: 'normal', mode: 'classic', date: '2026-08-02' });
      addScore({ score: 300, difficulty: 'hard', mode: 'classic', date: '2026-08-03' });

      const board = getLeaderboard();
      expect(board).toHaveLength(3);
      expect(board[0].score).toBe(300);
      expect(board[1].score).toBe(200);
      expect(board[2].score).toBe(100);

      clearLeaderboard();
      expect(getLeaderboard()).toEqual([]);
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { value: orig, writable: true, configurable: true });
    }
  });

  it('prunes to max 20 entries', () => {
    const store: Record<string, string> = {};
    const mock = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; }
    };
    const orig = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', { value: mock, writable: true, configurable: true });

    try {
      for (let i = 0; i < 25; i++) {
        addScore({ score: i * 10, difficulty: 'normal', mode: 'classic', date: '2026-08-01' });
      }
      const board = getLeaderboard();
      expect(board).toHaveLength(20);
      expect(board[0].score).toBe(240);
      expect(board[19].score).toBe(50);
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { value: orig, writable: true, configurable: true });
    }
  });

  it('isHighScore works with stored entries', () => {
    const store: Record<string, string> = {};
    const mock = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; }
    };
    const orig = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', { value: mock, writable: true, configurable: true });

    try {
      for (let i = 0; i < 20; i++) {
        addScore({ score: (i + 1) * 100, difficulty: 'normal', mode: 'classic', date: '2026-08-01' });
      }
      expect(isHighScore(2001)).toBe(true);
      expect(isHighScore(2000)).toBe(true);
      expect(isHighScore(101)).toBe(true);
      expect(isHighScore(100)).toBe(false);
      expect(isHighScore(50)).toBe(false);
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { value: orig, writable: true, configurable: true });
    }
  });
});
