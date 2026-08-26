import type { Difficulty } from './board';

const BEST_KEY = 'pocketpuzzle.best';
const CLASSIC_PREFIX = 'pocketpuzzle.best.classic.';
const MUTED_KEY = 'pocketpuzzle.muted';
const MODE_KEY = 'pocketpuzzle.mode';
const DIFFICULTY_KEY = 'pocketpuzzle.difficulty';
const DAILY_KEY = 'pocketpuzzle.daily';
const DAILY_KEEP = 30;

export type GameMode = 'classic' | 'daily';

export function loadBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function loadClassicBest(difficulty: Difficulty): number {
  try {
    const stored = Number(localStorage.getItem(CLASSIC_PREFIX + difficulty)) || 0;
    if (difficulty === 'normal') {
      const legacy = Number(localStorage.getItem(BEST_KEY)) || 0;
      return Math.max(stored, legacy);
    }
    return stored;
  } catch {
    return 0;
  }
}

export function saveClassicBest(difficulty: Difficulty, value: number): void {
  try {
    localStorage.setItem(CLASSIC_PREFIX + difficulty, String(value));
  } catch {}
}

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
  } catch {}
}

export function loadMode(): GameMode {
  try {
    const v = localStorage.getItem(MODE_KEY);
    if (v === 'daily') return 'daily';
  } catch {}
  return 'classic';
}

export function saveMode(mode: GameMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {}
}

export function loadDifficulty(): Difficulty {
  try {
    const v = localStorage.getItem(DIFFICULTY_KEY);
    if (v === 'easy' || v === 'hard') return v;
  } catch {}
  return 'normal';
}

export function saveDifficulty(difficulty: Difficulty): void {
  try {
    localStorage.setItem(DIFFICULTY_KEY, difficulty);
  } catch {}
}

function dailyKey(dateKey: string, difficulty: Difficulty): string {
  return `${dateKey}:${difficulty}`;
}

function readDaily(): Record<string, number> {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function pruneDaily(
  entries: Record<string, number>,
  keep: number = DAILY_KEEP
): Record<string, number> {
  const keys = Object.keys(entries).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  const out: Record<string, number> = {};
  for (const k of keys.slice(0, keep)) out[k] = entries[k];
  return out;
}

function writeDaily(entries: Record<string, number>): void {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(pruneDaily(entries)));
  } catch {}
}

export function loadDailyBest(dateKey: string, difficulty: Difficulty): number {
  return readDaily()[dailyKey(dateKey, difficulty)] ?? 0;
}

export function saveDailyBest(dateKey: string, difficulty: Difficulty, value: number): void {
  const all = readDaily();
  const key = dailyKey(dateKey, difficulty);
  all[key] = Math.max(all[key] ?? 0, value);
  writeDaily(all);
}
