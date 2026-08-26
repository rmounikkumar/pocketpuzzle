import { describe, expect, it } from 'vitest';
import { suggestHint, hintLabel } from './hints';
import { emptyGrid, type Grid } from './board';

describe('suggestHint', () => {
  it('returns a direction when moves are available', () => {
    const grid = emptyGrid(4);
    grid[0][0] = 2;
    grid[0][1] = 2;
    const hint = suggestHint(grid);
    expect(hint).not.toBeNull();
    expect(['up', 'down', 'left', 'right']).toContain(hint);
  });

  it('returns null when no moves are possible', () => {
    const grid: Grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2]
    ];
    expect(suggestHint(grid)).toBeNull();
  });

  it('suggests left when two tiles can merge horizontally right-of-center', () => {
    const grid = emptyGrid(4);
    grid[0][2] = 2;
    grid[0][3] = 2;
    const hint = suggestHint(grid);
    expect(hint).toBe('left');
  });

  it('suggests a direction for a 3x3 grid', () => {
    const grid = emptyGrid(3);
    grid[0][0] = 4;
    grid[0][1] = 4;
    const hint = suggestHint(grid);
    expect(hint).not.toBeNull();
  });
});

describe('hintLabel', () => {
  it('formats a direction with arrow', () => {
    expect(hintLabel('left')).toBe('Try going left \u2190');
    expect(hintLabel('up')).toBe('Try going up \u2191');
  });

  it('returns no-moves message for null', () => {
    expect(hintLabel(null)).toBe('No moves available');
  });
});
