import { move, type Direction, type Grid } from './board';

const DIRECTION_ARROWS: Record<Direction, string> = {
  up: '\u2191',
  down: '\u2193',
  left: '\u2190',
  right: '\u2192'
};

function evaluateBoard(grid: Grid): number {
  const size = grid.length;
  let score = 0;
  let empty = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r][c];
      if (v === 0) {
        empty++;
        continue;
      }
      score += v;
      if ((r === 0 || r === size - 1) && (c === 0 || c === size - 1)) {
        score += v;
      }
    }
  }

  score += empty * 100;
  return score;
}

export function suggestHint(grid: Grid): Direction | null {
  const dirs: Direction[] = ['up', 'down', 'left', 'right'];
  let bestDir: Direction | null = null;
  let bestScore = -Infinity;

  for (const dir of dirs) {
    const result = move(grid, dir);
    if (!result.moved) continue;
    const score = evaluateBoard(result.grid) + result.gained * 2;
    if (score > bestScore) {
      bestScore = score;
      bestDir = dir;
    }
  }

  return bestDir;
}

export function hintLabel(dir: Direction | null): string {
  if (!dir) return 'No moves available';
  return `Try going ${dir} ${DIRECTION_ARROWS[dir]}`;
}
