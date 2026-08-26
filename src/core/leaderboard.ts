import { type Difficulty } from './board';
import { type GameMode } from './storage';

export interface LeaderboardEntry {
  score: number;
  difficulty: Difficulty;
  mode: GameMode;
  date: string;
  timestamp: number;
}

const STORAGE_KEY = 'pocketpuzzle_leaderboard';
const MAX_ENTRIES = 20;

function safeGet(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeSet(val: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, val);
  } catch {
    // silent
  }
}

function safeRemove(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

export function getLeaderboard(): LeaderboardEntry[] {
  const raw = safeGet();
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function addScore(entry: Omit<LeaderboardEntry, 'timestamp'>): void {
  const board = getLeaderboard();
  board.push({ ...entry, timestamp: Date.now() });
  board.sort((a, b) => b.score - a.score);
  safeSet(JSON.stringify(board.slice(0, MAX_ENTRIES)));
}

export function clearLeaderboard(): void {
  safeRemove();
}

export function isHighScore(score: number): boolean {
  if (score <= 0) return false;
  const board = getLeaderboard();
  if (board.length < MAX_ENTRIES) return true;
  return score > board[board.length - 1].score;
}
