import { type Coord, type Grid, type Difficulty } from '../core/board';
import type { GameMode } from '../core/storage';

export interface OverlayState {
  visible: boolean;
  text: string;
  showContinue: boolean;
  showCopy: boolean;
}

export interface Fx {
  merged: Coord[];
  spawned: Coord | null;
}

export interface UiHandles {
  scoreBoxEl: HTMLElement;
  scoreEl: HTMLElement;
  bestEl: HTMLElement;
  modeClassicEl: HTMLElement;
  modeDailyEl: HTMLElement;
  diffEasyEl: HTMLElement;
  diffNormalEl: HTMLElement;
  diffHardEl: HTMLElement;
  modeLabelEl: HTMLElement;
  boardEl: HTMLElement;
  overlayEl: HTMLElement;
  overlayTitleEl: HTMLElement;
  overlayButtonEl: HTMLElement;
  continueBtnEl: HTMLElement;
  copyBtnEl: HTMLElement;
  soundBtnEl: HTMLElement;
  hintBtnEl: HTMLElement;
  hintMsgEl: HTMLElement;
}

const TILE_VALUES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

function tileClass(value: number): string {
  return TILE_VALUES.includes(value) ? `tile v${value}` : 'tile vsuper';
}

export function mountUi(root: HTMLElement): UiHandles {
  root.innerHTML = `
    <header class="hud">
      <div class="brand">
        <div class="brand-row">
          <h1>PocketPuzzle</h1>
        </div>
        <p id="mode-label" class="tagline"></p>
      </div>
      <div class="scores">
        <div class="scorebox"><span class="label">Score</span><span id="score" class="value">0</span></div>
        <div class="scorebox"><span class="label">Best</span><span id="best" class="value">0</span></div>
      </div>
    </header>
    <div class="modebar">
      <button id="mode-classic" type="button" class="mode-btn active">Classic</button>
      <button id="mode-daily" type="button" class="mode-btn">Daily</button>
    </div>
    <div class="modebar diffbar">
      <button id="diff-easy" type="button" class="mode-btn small">Easy 5x5</button>
      <button id="diff-normal" type="button" class="mode-btn small active">Normal 4x4</button>
      <button id="diff-hard" type="button" class="mode-btn small">Hard 3x3</button>
    </div>
    <div class="board-wrap">
      <div id="board" class="board"></div>
      <div id="overlay" class="overlay hidden">
        <p id="overlay-title"></p>
        <div class="btn-row">
          <button id="continue-button" type="button">Continue</button>
          <button id="copy-button" type="button" class="btn-secondary hidden">Copy Result</button>
          <button id="overlay-button" type="button">New Game</button>
        </div>
      </div>
    </div>
    <div id="hint-msg" class="hint-msg hidden"></div>
    <footer class="controls">
      <div class="btn-row">
        <button id="new-game" type="button">New Game</button>
        <button id="hint-btn" type="button" class="btn-secondary">Hint</button>
        <button id="sound-toggle" type="button" class="btn-secondary">Sound: On</button>
      </div>
      <p class="hint">Arrow keys / WASD / swipe &middot; <a href="./privacy.html">Privacy</a></p>
    </footer>`;

  return {
    scoreBoxEl: document.getElementById('score')?.parentElement as HTMLElement,
    scoreEl: document.getElementById('score') as HTMLElement,
    bestEl: document.getElementById('best') as HTMLElement,
    modeClassicEl: document.getElementById('mode-classic') as HTMLElement,
    modeDailyEl: document.getElementById('mode-daily') as HTMLElement,
    diffEasyEl: document.getElementById('diff-easy') as HTMLElement,
    diffNormalEl: document.getElementById('diff-normal') as HTMLElement,
    diffHardEl: document.getElementById('diff-hard') as HTMLElement,
    modeLabelEl: document.getElementById('mode-label') as HTMLElement,
    boardEl: document.getElementById('board') as HTMLElement,
    overlayEl: document.getElementById('overlay') as HTMLElement,
    overlayTitleEl: document.getElementById('overlay-title') as HTMLElement,
    overlayButtonEl: document.getElementById('overlay-button') as HTMLElement,
    continueBtnEl: document.getElementById('continue-button') as HTMLElement,
    copyBtnEl: document.getElementById('copy-button') as HTMLElement,
    soundBtnEl: document.getElementById('sound-toggle') as HTMLElement,
    hintBtnEl: document.getElementById('hint-btn') as HTMLElement,
    hintMsgEl: document.getElementById('hint-msg') as HTMLElement
  };
}

export function buildBoard(ui: UiHandles, size: number): void {
  ui.boardEl.innerHTML = '';
  ui.boardEl.className = `board size-${size}`;
  ui.boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    ui.boardEl.appendChild(cell);
  }
}

export function render(
  ui: UiHandles,
  grid: Grid,
  score: number,
  best: number,
  overlay: OverlayState,
  fx?: Fx
): void {
  ui.scoreEl.textContent = String(score);
  ui.bestEl.textContent = String(best);

  const size = grid.length;
  const mergedKeys = new Set((fx?.merged ?? []).map(([r, c]) => `${r}:${c}`));
  const spawnKey = fx?.spawned ? `${fx.spawned[0]}:${fx.spawned[1]}` : '';

  const cells = ui.boardEl.children;
  let idx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = cells[idx++] as HTMLElement;
      if (!cell) continue;
      const value = grid[r][c];
      cell.innerHTML = '';
      if (value !== 0) {
        const key = `${r}:${c}`;
        let cls = tileClass(value);
        if (key === spawnKey) cls += ' spawn';
        else if (mergedKeys.has(key)) cls += ' merge';
        const tile = document.createElement('div');
        tile.className = cls;
        tile.textContent = String(value);
        cell.appendChild(tile);
      }
    }
  }

  ui.overlayTitleEl.textContent = overlay.text;
  ui.overlayEl.classList.toggle('hidden', !overlay.visible);
  ui.continueBtnEl.classList.toggle('hidden', !overlay.showContinue);
  ui.copyBtnEl.classList.toggle('hidden', !overlay.showCopy);
  ui.overlayButtonEl.textContent = overlay.text === 'Game Over' ? 'New Game' : 'Restart';
}

export function setModeUi(ui: UiHandles, mode: GameMode, label: string): void {
  ui.modeClassicEl.classList.toggle('active', mode === 'classic');
  ui.modeDailyEl.classList.toggle('active', mode === 'daily');
  ui.modeLabelEl.textContent = label;
}

export function setDifficultyUi(ui: UiHandles, difficulty: Difficulty): void {
  ui.diffEasyEl.classList.toggle('active', difficulty === 'easy');
  ui.diffNormalEl.classList.toggle('active', difficulty === 'normal');
  ui.diffHardEl.classList.toggle('active', difficulty === 'hard');
}

export function showGain(ui: UiHandles, amount: number): void {
  if (amount <= 0) return;
  const span = document.createElement('span');
  span.className = 'gain';
  span.textContent = `+${amount}`;
  ui.scoreBoxEl.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
  window.setTimeout(() => span.remove(), 800);
}

export function shakeBoard(ui: UiHandles): void {
  ui.boardEl.classList.remove('shake');
  void ui.boardEl.offsetWidth;
  ui.boardEl.classList.add('shake');
  window.setTimeout(() => ui.boardEl.classList.remove('shake'), 350);
}

export function showCombo(ui: UiHandles, count: number): void {
  const el = document.createElement('div');
  el.className = 'combo-float';
  el.textContent = `COMBO x${count}`;
  ui.boardEl.parentElement?.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
  window.setTimeout(() => el.remove(), 900);
}

export function celebrate(ui: UiHandles, coords: Coord[], maxValue: number): void {
  const total = ui.boardEl.children.length;
  const size = Math.round(Math.sqrt(total));
  if (size * size !== total) return;
  for (const [r, c] of coords) {
    const cell = ui.boardEl.children[r * size + c] as HTMLElement | undefined;
    if (!cell) continue;
    const ring = document.createElement('span');
    ring.className = maxValue >= 256 ? 'ring ring-big' : 'ring';
    const dim = cell.offsetWidth * 1.6;
    ring.style.left = `${cell.offsetLeft + cell.offsetWidth / 2}px`;
    ring.style.top = `${cell.offsetTop + cell.offsetHeight / 2}px`;
    ring.style.width = `${dim}px`;
    ring.style.height = `${dim}px`;
    ui.boardEl.appendChild(ring);
    ring.addEventListener('animationend', () => ring.remove());
    window.setTimeout(() => ring.remove(), 850);
  }
}

export function showNewBest(ui: UiHandles): void {
  const box = ui.bestEl.parentElement;
  if (!box || box.querySelector('.new-best')) return;
  const el = document.createElement('span');
  el.className = 'new-best';
  el.textContent = 'New Best!';
  box.appendChild(el);
  window.setTimeout(() => el.remove(), 1500);
}
