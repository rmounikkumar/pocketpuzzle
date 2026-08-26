import { type Difficulty } from './board';
import { type GameMode } from './storage';

export interface LeaderboardEntry {
  score: number;
  difficulty: Difficulty;
  mode: GameMode;
  date: string;
  timestamp: number;
  player?: string;
}

const STORAGE_KEY = 'pocketpuzzle_leaderboard';
const USERNAME_KEY = 'pocketpuzzle_username';
const MAX_ENTRIES = 20;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, val: string): void {
  try {
    localStorage.setItem(key, val);
  } catch {
    // silent
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // silent
  }
}

export function getUsername(): string {
  return safeGet(USERNAME_KEY) ?? '';
}

export function setUsername(name: string): void {
  const trimmed = name.trim().slice(0, 20);
  if (trimmed) safeSet(USERNAME_KEY, trimmed);
  else safeRemove(USERNAME_KEY);
}

export function getLeaderboard(): LeaderboardEntry[] {
  const raw = safeGet(STORAGE_KEY);
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
  safeSet(STORAGE_KEY, JSON.stringify(board.slice(0, MAX_ENTRIES)));
}

export function clearLeaderboard(): void {
  safeRemove(STORAGE_KEY);
}

export function isHighScore(score: number): boolean {
  if (score <= 0) return false;
  const board = getLeaderboard();
  if (board.length < MAX_ENTRIES) return true;
  return score > board[board.length - 1].score;
}
