import './styles.css';
import { initLanding } from './landing';
import { ads } from './ads/adBridge';
import {
  DIFFICULTY_SIZE,
  emptyGrid,
  hasMoves,
  isWin,
  move,
  spawnTile,
  type Difficulty,
  type Direction,
  type Grid
} from './core/board';
import { sound } from './core/audio';
import { initAnalytics, trackEvent } from './core/analytics';
import { suggestHint, hintLabel } from './core/hints';
import { dailyNumber, localDateKey, mulberry32, seedFromKey } from './core/rng';
import { addScore, getLeaderboard } from './core/leaderboard';
import {
  loadClassicBest,
  loadDailyBest,
  loadDifficulty,
  loadMode,
  saveClassicBest,
  saveDailyBest,
  saveDifficulty,
  saveMode,
  type GameMode
} from './core/storage';
import {
  buildBoard,
  celebrate,
  mountUi,
  render,
  renderLeaderboard,
  setDifficultyUi,
  setModeUi,
  shakeBoard,
  showCombo,
  showGain,
  showNewBest,
  type Fx,
  type UiHandles
} from './ui/renderer';

interface GameState {
  grid: Grid;
  score: number;
  best: number;
  won: boolean;
  continued: boolean;
  over: boolean;
  bestCelebrated: boolean;
  combo: number;
  mode: GameMode;
  difficulty: Difficulty;
  dailyDate: string;
  rng: () => number;
  scoreRecorded: boolean;
}

let ui: UiHandles;

function overlayFor(state: GameState) {
  if (state.over)
    return { visible: true, text: 'Game Over', showContinue: false, showCopy: state.mode === 'daily' };
  if (state.won && !state.continued)
    return { visible: true, text: 'You win!', showContinue: true, showCopy: false };
  return { visible: false, text: '', showContinue: false, showCopy: false };
}

function draw(state: GameState, fx?: Fx): void {
  render(ui, state.grid, state.score, state.best, overlayFor(state), fx);
}

function loadBestFor(state: GameState): number {
  return state.mode === 'daily'
    ? loadDailyBest(state.dailyDate, state.difficulty)
    : loadClassicBest(state.difficulty);
}

function saveScoreFor(state: GameState): void {
  if (state.mode === 'daily') saveDailyBest(state.dailyDate, state.difficulty, state.best);
  else saveClassicBest(state.difficulty, state.best);
}

function recordScore(state: GameState): void {
  if (state.scoreRecorded || state.score <= 0) return;
  addScore({ score: state.score, difficulty: state.difficulty, mode: state.mode, date: localDateKey() });
  state.scoreRecorded = true;
  trackEvent('score_recorded', { score: state.score, mode: state.mode, difficulty: state.difficulty });
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard'
};

function modeLabel(state: GameState): string {
  const diff = DIFFICULTY_LABEL[state.difficulty];
  if (state.mode === 'daily')
    return `Daily #${dailyNumber(state.dailyDate)} · ${state.dailyDate} · ${diff}`;
  return `${diff} · join the numbers, reach 2048`;
}

function applyRng(state: GameState): void {
  state.dailyDate = localDateKey();
  state.rng =
    state.mode === 'daily' ? mulberry32(seedFromKey(state.dailyDate)) : Math.random;
}

function syncModeUi(state: GameState): void {
  setModeUi(ui, state.mode, modeLabel(state));
  setDifficultyUi(ui, state.difficulty);
}

function setMode(state: GameState, mode: GameMode): void {
  if (state.mode === mode) return;
  recordScore(state);
  state.mode = mode;
  saveMode(mode);
  applyRng(state);
  syncModeUi(state);
  newGame(state);
}

function setDifficulty(state: GameState, difficulty: Difficulty): void {
  if (state.difficulty === difficulty) return;
  recordScore(state);
  state.difficulty = difficulty;
  saveDifficulty(difficulty);
  syncModeUi(state);
  buildBoard(ui, DIFFICULTY_SIZE[difficulty]);
  newGame(state);
}

async function copyResult(state: GameState): Promise<boolean> {
  const text = `PocketPuzzle Daily #${dailyNumber(state.dailyDate)} (${state.dailyDate}, ${DIFFICULTY_LABEL[state.difficulty]}) - score ${state.score}`;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function newGame(state: GameState): void {
  ui.hintMsgEl.classList.add('hidden');
  recordScore(state);
  state.grid = emptyGrid(DIFFICULTY_SIZE[state.difficulty]);
  spawnTile(state.grid, state.rng);
  spawnTile(state.grid, state.rng);
  state.score = 0;
  state.won = false;
  state.continued = false;
  state.over = false;
  state.bestCelebrated = false;
  state.combo = 0;
  state.scoreRecorded = false;
  state.best = loadBestFor(state);
  draw(state);
}

function tryMove(state: GameState, dir: Direction): void {
  if (state.over) return;
  ui.hintMsgEl.classList.add('hidden');
  const result = move(state.grid, dir);
  if (!result.moved) {
    shakeBoard(ui);
    return;
  }
  sound.move();
  const spawned = spawnTile(result.grid, state.rng);
  state.grid = result.grid;
  state.score += result.gained;

  state.combo = result.gained > 0 ? state.combo + 1 : 0;
  if (state.combo >= 2) {
    showCombo(ui, state.combo);
    sound.combo(state.combo);
  }

  let maxMerged = 0;
  for (const [r, c] of result.merged) maxMerged = Math.max(maxMerged, result.grid[r][c]);

  if (result.gained > 0) {
    sound.merge(result.gained);
    showGain(ui, result.gained);
  }
  if (maxMerged >= 64) celebrate(ui, result.merged, maxMerged);

  if (state.score > state.best) {
    if (!state.bestCelebrated && state.best >= 100 && !state.won) {
      showNewBest(ui);
      sound.best();
      state.bestCelebrated = true;
    }
    state.best = state.score;
    saveScoreFor(state);
  }

  if (!state.won && isWin(state.grid)) {
    state.won = true;
    state.continued = false;
    sound.win();
  }
  if (!hasMoves(state.grid)) {
    state.over = true;
    sound.lose();
    recordScore(state);
    trackEvent('game_over', { score: state.score, mode: state.mode, difficulty: state.difficulty });
    void ads.showInterstitial();
  }
  draw(state, { merged: result.merged, spawned });
}

function bindInput(state: GameState): void {
  const keyMap: Record<string, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    s: 'down',
    a: 'left',
    d: 'right'
  };

  window.addEventListener('keydown', (e) => {
    const dir = keyMap[e.key];
    if (dir) {
      e.preventDefault();
      sound.unlock();
      tryMove(state, dir);
    }
  });

  let startX = 0;
  let startY = 0;
  const threshold = 24;

  window.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
  });

  window.addEventListener('pointerup', (e) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
    sound.unlock();
    if (Math.abs(dx) > Math.abs(dy)) tryMove(state, dx > 0 ? 'right' : 'left');
    else tryMove(state, dy > 0 ? 'down' : 'up');
  });
}

async function main(): Promise<void> {
  await initLanding();

  initAnalytics();
  const root = document.getElementById('app') as HTMLElement;
  ui = mountUi(root);

  const initialMode = loadMode();
  const state: GameState = {
    grid: emptyGrid(),
    score: 0,
    best: 0,
    won: false,
    continued: false,
    over: false,
    bestCelebrated: false,
    combo: 0,
    mode: initialMode,
    difficulty: loadDifficulty(),
    dailyDate: '',
    rng: Math.random,
    scoreRecorded: false
  };
  applyRng(state);

  document.getElementById('new-game')?.addEventListener('click', () => newGame(state));
  ui.overlayButtonEl.addEventListener('click', () => newGame(state));
  ui.continueBtnEl.addEventListener('click', () => {
    state.continued = true;
    draw(state);
  });
  ui.modeClassicEl.addEventListener('click', () => setMode(state, 'classic'));
  ui.modeDailyEl.addEventListener('click', () => setMode(state, 'daily'));
  ui.diffEasyEl.addEventListener('click', () => setDifficulty(state, 'easy'));
  ui.diffNormalEl.addEventListener('click', () => setDifficulty(state, 'normal'));
  ui.diffHardEl.addEventListener('click', () => setDifficulty(state, 'hard'));

  let copyTimer = 0;
  ui.copyBtnEl.addEventListener('click', () => {
    window.clearTimeout(copyTimer);
    void copyResult(state).then((ok) => {
      if (ok) trackEvent('daily_result_copied', { score: state.score });
      ui.copyBtnEl.textContent = ok ? 'Copied!' : 'Copy failed';
      copyTimer = window.setTimeout(() => {
        ui.copyBtnEl.textContent = 'Copy Result';
      }, 1200);
    });
  });

  const syncSoundLabel = () => {
    ui.soundBtnEl.textContent = sound.isMuted() ? 'Sound: Off' : 'Sound: On';
  };
  syncSoundLabel();
  ui.soundBtnEl.addEventListener('click', () => {
    sound.setMuted(!sound.isMuted());
    syncSoundLabel();
  });

  let hintTimer = 0;
  ui.hintBtnEl.addEventListener('click', async () => {
    if (state.over) return;
    window.clearTimeout(hintTimer);
    ui.hintBtnEl.textContent = 'Watching ad...';
    ui.hintBtnEl.setAttribute('disabled', 'true');
    const rewarded = await ads.showRewarded();
    ui.hintBtnEl.removeAttribute('disabled');
    ui.hintBtnEl.textContent = 'Hint';
    if (!rewarded) return;
    const dir = suggestHint(state.grid);
    ui.hintMsgEl.textContent = hintLabel(dir);
    ui.hintMsgEl.classList.remove('hidden');
    trackEvent('hint_used', { score: state.score, mode: state.mode, difficulty: state.difficulty });
    hintTimer = window.setTimeout(() => {
      ui.hintMsgEl.classList.add('hidden');
    }, 4000);
  });

  function refreshLeaderboard(): void {
    renderLeaderboard(ui.leaderboardListEl, getLeaderboard());
  }

  ui.leaderboardBtnEl.addEventListener('click', () => {
    refreshLeaderboard();
    ui.leaderboardOverlayEl.classList.remove('hidden');
  });
  ui.leaderboardCloseEl.addEventListener('click', () => {
    ui.leaderboardOverlayEl.classList.add('hidden');
  });
  ui.leaderboardOverlayEl.addEventListener('click', (e) => {
    if (e.target === ui.leaderboardOverlayEl) ui.leaderboardOverlayEl.classList.add('hidden');
  });

  buildBoard(ui, DIFFICULTY_SIZE[state.difficulty]);
  syncModeUi(state);
  newGame(state);

  root.classList.add('reveal');
  setTimeout(() => {
    bindInput(state);
    void ads.init();
  }, 700);
}

main();
