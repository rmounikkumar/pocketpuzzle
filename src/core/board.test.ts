import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_SIZE,
  emptyGrid,
  hasMoves,
  isWin,
  move,
  SIZE,
  spawnTile,
  type Grid,
  WIN_VALUE
} from './board';

function gridFrom(rows: number[][]): Grid {
  return rows.map((row) => [...row]);
}

describe('emptyGrid', () => {
  it('creates a SIZE x SIZE grid of zeros', () => {
    const g = emptyGrid();
    expect(g).toHaveLength(SIZE);
    g.forEach((row) => expect(row).toHaveLength(SIZE));
    expect(g.flat().every((v) => v === 0)).toBe(true);
  });
});

describe('spawnTile', () => {
  it('fills exactly one empty cell with 2 or 4', () => {
    const g = emptyGrid();
    const pos = spawnTile(g);
    expect(pos).not.toBeNull();
    const values = g.flat();
    expect(values.filter((v) => v !== 0)).toHaveLength(1);
    expect([2, 4]).toContain(values.find((v) => v !== 0));
  });

  it('returns null on a full grid and changes nothing', () => {
    const g = gridFrom([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2]
    ]);
    expect(spawnTile(g)).toBeNull();
    expect(g.flat().filter((v) => v === 0)).toHaveLength(0);
  });

  it('is deterministic under a fixed rng (first empty cell, value 2)', () => {
    const g = emptyGrid();
    const pos = spawnTile(g, () => 0);
    expect(g[0][0]).toBe(2);
    expect(pos).toEqual([0, 0]);
  });
});

describe('move left', () => {
  it('merges one pair', () => {
    const r = move(gridFrom([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
    expect(r.grid[0]).toEqual([4, 0, 0, 0]);
    expect(r.gained).toBe(4);
    expect(r.moved).toBe(true);
  });

  it('merges the leftmost pair first when three equal tiles line up', () => {
    const r = move(gridFrom([[2, 2, 2, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
    expect(r.grid[0]).toEqual([4, 2, 0, 0]);
    expect(r.gained).toBe(4);
  });

  it('merges two pairs from four equal tiles', () => {
    const r = move(gridFrom([[2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
    expect(r.grid[0]).toEqual([4, 4, 0, 0]);
    expect(r.gained).toBe(8);
  });

  it('slides tiles over gaps without merging different values', () => {
    const r = move(gridFrom([[0, 2, 0, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
    expect(r.grid[0]).toEqual([2, 4, 0, 0]);
    expect(r.gained).toBe(0);
  });

  it('reports moved=false when nothing can change', () => {
    const r = move(gridFrom([[2, 4, 8, 16], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
    expect(r.moved).toBe(false);
    expect(r.gained).toBe(0);
  });

  it('never merges a tile twice in one move', () => {
    const r = move(gridFrom([[4, 2, 2, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
    expect(r.grid[0]).toEqual([4, 4, 0, 0]);
    expect(r.gained).toBe(4);
  });
});

describe('merge coordinates', () => {
  it('reports the output position of a merged pair', () => {
    const r = move(gridFrom([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
    expect(r.merged).toEqual([[0, 0]]);
  });

  it('reports both merge positions from four equal tiles', () => {
    const r = move(gridFrom([[2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
    expect(r.merged).toEqual([[0, 0], [0, 1]]);
  });

  it('reports no positions when nothing merges', () => {
    const r = move(gridFrom([[2, 4, 8, 16], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
    expect(r.merged).toEqual([]);
  });

  it('maps rightward merges to mirrored columns', () => {
    const r = move(gridFrom([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'right');
    expect(r.merged).toEqual([[0, 3]]);
  });

  it('maps upward merges to rows', () => {
    const r = move(
      gridFrom([
        [2, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]),
      'up'
    );
    expect(r.merged).toEqual([[0, 0]]);
  });
});

describe('move direction symmetry', () => {
  it('moves right as the mirror of left', () => {
    const r = move(gridFrom([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'right');
    expect(r.grid[0]).toEqual([0, 0, 0, 4]);
  });

  it('moves up along columns', () => {
    const r = move(
      gridFrom([
        [0, 0, 0, 0],
        [2, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0]
      ]),
      'up'
    );
    expect(r.grid.map((row) => row[0])).toEqual([4, 0, 0, 0]);
  });

  it('moves down along columns', () => {
    const r = move(
      gridFrom([
        [2, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]),
      'down'
    );
    expect(r.grid.map((row) => row[0])).toEqual([0, 0, 0, 4]);
  });

  it('does not mutate the input grid', () => {
    const before = gridFrom([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const snapshot = JSON.stringify(before);
    move(before, 'left');
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe('hasMoves', () => {
  it('is true when any cell is empty', () => {
    const g = gridFrom([
      [2, 4, 8, 16],
      [16, 8, 4, 2],
      [2, 4, 8, 16],
      [16, 8, 4, 0]
    ]);
    expect(hasMoves(g)).toBe(true);
  });

  it('is true when adjacent equals exist on a full grid', () => {
    const g = gridFrom([
      [2, 2, 4, 8],
      [8, 4, 2, 4],
      [4, 8, 4, 2],
      [2, 4, 8, 4]
    ]);
    expect(hasMoves(g)).toBe(true);
  });

  it('is false on a full dead grid', () => {
    const g = gridFrom([
      [2, 4, 8, 16],
      [16, 8, 4, 2],
      [2, 4, 8, 16],
      [16, 8, 4, 2]
    ]);
    expect(hasMoves(g)).toBe(false);
  });
});

describe('variable board sizes', () => {
  it('creates grids of any size', () => {
    const g5 = emptyGrid(5);
    expect(g5).toHaveLength(5);
    g5.forEach((row) => expect(row).toHaveLength(5));
    const g3 = emptyGrid(3);
    expect(g3).toHaveLength(3);
    g3.forEach((row) => expect(row).toHaveLength(3));
  });

  it('slides and merges on a 5-wide row', () => {
    const r = move(gridFrom([[2, 2, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]), 'left');
    expect(r.grid[0]).toEqual([4, 0, 0, 0, 0]);
    expect(r.gained).toBe(4);
    expect(r.moved).toBe(true);
  });

  it('pads 5-wide lines correctly after merges', () => {
    const r = move(gridFrom([[0, 4, 4, 2, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]), 'left');
    expect(r.grid[0]).toEqual([8, 2, 0, 0, 0]);
  });

  it('detects a dead 3x3 grid', () => {
    const g = gridFrom([
      [2, 4, 8],
      [8, 2, 4],
      [4, 8, 2]
    ]);
    expect(hasMoves(g)).toBe(false);
  });

  it('moves down on a 3x3 grid', () => {
    const r = move(
      gridFrom([
        [2, 0, 0],
        [2, 0, 0],
        [0, 0, 0]
      ]),
      'down'
    );
    expect(r.grid.map((row) => row[0])).toEqual([0, 0, 4]);
  });

  it('spawns within 3x3 bounds', () => {
    const g = emptyGrid(3);
    const pos = spawnTile(g, () => 0);
    expect(pos).toEqual([0, 0]);
    expect(g).toHaveLength(3);
    expect(g[0]).toHaveLength(3);
  });

  it('maps difficulty presets to grid sizes', () => {
    expect(DIFFICULTY_SIZE.easy).toBe(5);
    expect(DIFFICULTY_SIZE.normal).toBe(4);
    expect(DIFFICULTY_SIZE.hard).toBe(3);
    expect(SIZE).toBe(4);
  });
});

describe('isWin', () => {
  it('detects WIN_VALUE', () => {
    const g = gridFrom([[0, 0, 0, WIN_VALUE]]);
    expect(isWin(g)).toBe(true);
  });

  it('is false below WIN_VALUE', () => {
    const g = gridFrom([[0, 0, 0, 1024]]);
    expect(isWin(g)).toBe(false);
  });
});
