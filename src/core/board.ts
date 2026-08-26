export type Direction = 'up' | 'down' | 'left' | 'right';
export type Grid = number[][];
export type Coord = [number, number];
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface MoveResult {
  grid: Grid;
  gained: number;
  moved: boolean;
  merged: Coord[];
}

export const SIZE = 4;
export const WIN_VALUE = 2048;

export const DIFFICULTY_SIZE: Record<Difficulty, number> = {
  easy: 5,
  normal: 4,
  hard: 3
};

export function emptyGrid(size: number = SIZE): Grid {
  return Array.from({ length: size }, () => Array<number>(size).fill(0));
}

export function spawnTile(grid: Grid, rng: () => number = Math.random): Coord | null {
  const size = grid.length;
  const empties: Coord[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) empties.push([r, c]);
    }
  }
  if (empties.length === 0) return null;
  const [r, c] = empties[Math.floor(rng() * empties.length)];
  grid[r][c] = rng() < 0.9 ? 2 : 4;
  return [r, c];
}

function slideLeft(line: number[]): { line: number[]; gained: number; mergedIdx: number[] } {
  const size = line.length;
  const values = line.filter((v) => v !== 0);
  const out: number[] = [];
  const mergedIdx: number[] = [];
  let gained = 0;
  for (let i = 0; i < values.length; i++) {
    if (i + 1 < values.length && values[i] === values[i + 1]) {
      out.push(values[i] * 2);
      mergedIdx.push(out.length - 1);
      gained += values[i] * 2;
      i++;
    } else {
      out.push(values[i]);
    }
  }
  while (out.length < size) out.push(0);
  return { line: out, gained, mergedIdx };
}

function coordOf(size: number, dir: Direction, i: number, j: number): Coord {
  switch (dir) {
    case 'left':
      return [i, j];
    case 'right':
      return [i, size - 1 - j];
    case 'up':
      return [j, i];
    case 'down':
      return [size - 1 - j, i];
  }
}

function readLine(grid: Grid, size: number, dir: Direction, i: number, j: number): number {
  switch (dir) {
    case 'left':
      return grid[i][j];
    case 'right':
      return grid[i][size - 1 - j];
    case 'up':
      return grid[j][i];
    case 'down':
      return grid[size - 1 - j][i];
  }
}

function writeLine(grid: Grid, size: number, dir: Direction, i: number, j: number, v: number): void {
  switch (dir) {
    case 'left':
      grid[i][j] = v;
      break;
    case 'right':
      grid[i][size - 1 - j] = v;
      break;
    case 'up':
      grid[j][i] = v;
      break;
    case 'down':
      grid[size - 1 - j][i] = v;
      break;
  }
}

export function move(grid: Grid, dir: Direction): MoveResult {
  const size = grid.length;
  let gained = 0;
  const merged: Coord[] = [];
  const out = emptyGrid(size);
  for (let i = 0; i < size; i++) {
    const line: number[] = [];
    for (let j = 0; j < size; j++) line.push(readLine(grid, size, dir, i, j));
    const result = slideLeft(line);
    gained += result.gained;
    for (const j of result.mergedIdx) merged.push(coordOf(size, dir, i, j));
    for (let j = 0; j < size; j++) writeLine(out, size, dir, i, j, result.line[j]);
  }
  const moved = JSON.stringify(out) !== JSON.stringify(grid);
  return { grid: out, gained, moved, merged };
}

export function hasMoves(grid: Grid): boolean {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) return true;
      if (c + 1 < size && grid[r][c] === grid[r][c + 1]) return true;
      if (r + 1 < size && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

export function isWin(grid: Grid): boolean {
  return grid.some((row) => row.some((v) => v >= WIN_VALUE));
}
