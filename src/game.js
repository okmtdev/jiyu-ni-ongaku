// ===== Music Sequencer Game Screen =====
import {
  INSTRUMENTS, STEPS, createEmptyGrid,
  playSound, startPlayback, stopPlayback, isPlaying
} from './audio.js';
import { saveSong, getSong, getNextSongNumber } from './api.js';

// ===== Preset Patterns =====
const PRESETS = {
  dondon: {
    taiko: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    suzu:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    pan:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    piko:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    poron: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    shara: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
  },
  kirakira: {
    taiko: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    suzu:  [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],
    pan:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    piko:  [0,0,1,0, 0,1,0,0, 1,0,0,0, 0,1,0,1],
    poron: [0,1,0,0, 1,0,0,1, 0,0,1,0, 0,0,1,0],
    shara: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
  },
  tanoshii: {
    taiko: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
    suzu:  [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    pan:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    piko:  [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
    poron: [0,0,0,0, 0,0,0,0, 0,1,0,0, 0,0,0,0],
    shara: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
  },
};

function applyPreset(grid, presetName) {
  const preset = PRESETS[presetName];
  if (!preset) return;
  INSTRUMENTS.forEach(inst => {
    for (let i = 0; i < STEPS; i++) {
      grid[inst.id][i] = preset[inst.id] ? preset[inst.id][i] : 0;
    }
  });
}

function randomizeGrid(grid) {
  INSTRUMENTS.forEach(inst => {
    for (let i = 0; i < STEPS; i++) {
      grid[inst.id][i] = Math.random() < 0.2 ? 1 : 0;
    }
  });
}

function clearGrid(grid) {
  INSTRUMENTS.forEach(inst => {
    for (let i = 0; i < STEPS; i++) {
      grid[inst.id][i] = 0;
    }
  });
}

function isGridEmpty(grid) {
  return INSTRUMENTS.every(inst =>
    grid[inst.id].every(v => v === 0)
  );
}

// ===== Render Game Screen =====
export function renderGame(container, songId = null, autoplay = false) {
  const grid = createEmptyGrid();
  let bpm = 120;
  let currentSongId = songId;
  let currentSongName = '';

  container.innerHTML = `
    <div class="screen game-screen">
      <div class="game-header">
        <button class="btn btn-back" id="btn-back">\u2190 もどる</button>
        <div class="bpm-control">
          <button class="btn btn-bpm" id="btn-bpm-down">\u2212</button>
          <span class="bpm-display" id="bpm-display">\u266A ${bpm}</span>
          <button class="btn btn-bpm" id="btn-bpm-up">\uFF0B</button>
        </div>
      </div>
      <div class="grid-wrapper">
        <div class="grid-container" id="grid-container"></div>
      </div>
      <div class="preset-bar" id="preset-bar">
        <button class="btn btn-preset" data-preset="dondon">\u{1F941} どんどん</button>
        <button class="btn btn-preset" data-preset="kirakira">\u{1F514} きらきら</button>
        <button class="btn btn-preset" data-preset="tanoshii">\u2B50 たのしい</button>
        <button class="btn btn-preset" data-action="random">\u{1F3B2} ランダム</button>
        <button class="btn btn-preset" data-action="clear">\u{1F6AB} クリア</button>
      </div>
      <div class="game-footer">
        <button class="btn btn-play" id="btn-play">\u25B6 さいせい</button>
        <button class="btn btn-save" id="btn-save">\u{1F4BE} ほぞん</button>
      </div>
    </div>
  `;

  const gridContainer = document.getElementById('grid-container');
  const btnPlay = document.getElementById('btn-play');
  const btnSave = document.getElementById('btn-save');
  const bpmDisplay = document.getElementById('bpm-display');

  // Build the grid UI
  buildGrid(gridContainer, grid);

  // Load existing song if editing
  if (songId) {
    loadSong(songId, grid, bpm).then(song => {
      if (song) {
        bpm = song.bpm || 120;
        bpmDisplay.textContent = `\u266A ${bpm}`;
        currentSongName = song.name || '';
        refreshGridUI(gridContainer, grid);
        if (autoplay) {
          togglePlay();
        }
      }
    });
  }

  // ===== Event Listeners =====

  // Back button
  document.getElementById('btn-back').addEventListener('click', () => {
    stopPlayback();
    if (autoplay) {
      window.location.hash = '#/gallery';
    } else {
      window.location.hash = '#/';
    }
  });

  // BPM controls
  document.getElementById('btn-bpm-down').addEventListener('click', () => {
    bpm = Math.max(60, bpm - 10);
    bpmDisplay.textContent = `\u266A ${bpm}`;
    if (isPlaying()) {
      stopPlayback();
      togglePlay();
    }
  });

  document.getElementById('btn-bpm-up').addEventListener('click', () => {
    bpm = Math.min(240, bpm + 10);
    bpmDisplay.textContent = `\u266A ${bpm}`;
    if (isPlaying()) {
      stopPlayback();
      togglePlay();
    }
  });

  // Play/Stop
  function togglePlay() {
    if (isPlaying()) {
      stopPlayback();
      btnPlay.textContent = '\u25B6 さいせい';
      btnPlay.classList.remove('playing');
      clearStepHighlight();
    } else {
      btnPlay.textContent = '\u23F9 とめる';
      btnPlay.classList.add('playing');
      startPlayback(grid, bpm, (step) => {
        highlightStep(gridContainer, step);
      }, true);
    }
  }

  btnPlay.addEventListener('click', togglePlay);

  // Save
  btnSave.addEventListener('click', () => {
    if (isGridEmpty(grid)) {
      showMessage(container, 'おとをおいてね！');
      return;
    }
    showSaveModal(container, currentSongName, async (name) => {
      const song = await saveSong({
        id: currentSongId || undefined,
        name: name,
        bpm: bpm,
        grid: grid,
      });
      currentSongId = song.id;
      currentSongName = song.name;
      showMessage(container, 'ほぞんしたよ！');
    });
  });

  // Presets
  document.getElementById('preset-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-preset], [data-action]');
    if (!btn) return;

    const wasPlaying = isPlaying();
    if (wasPlaying) {
      stopPlayback();
      btnPlay.textContent = '\u25B6 さいせい';
      btnPlay.classList.remove('playing');
    }

    if (btn.dataset.preset) {
      applyPreset(grid, btn.dataset.preset);
    } else if (btn.dataset.action === 'random') {
      randomizeGrid(grid);
    } else if (btn.dataset.action === 'clear') {
      clearGrid(grid);
    }

    refreshGridUI(gridContainer, grid);

    if (wasPlaying) {
      togglePlay();
    }
  });
}

// ===== Build Grid =====
function buildGrid(container, grid) {
  container.innerHTML = '';

  INSTRUMENTS.forEach(inst => {
    const row = document.createElement('div');
    row.className = 'grid-row';

    // Instrument label
    const label = document.createElement('div');
    label.className = 'grid-label';
    label.style.backgroundColor = inst.color;
    label.innerHTML = `<span class="label-emoji">${inst.emoji}</span><span class="label-name">${inst.name}</span>`;
    label.addEventListener('click', () => playSound(inst.id));
    row.appendChild(label);

    // Beat cells
    const cells = document.createElement('div');
    cells.className = 'grid-cells';

    for (let i = 0; i < STEPS; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      if (i % 4 === 0) cell.classList.add('beat-start');
      cell.dataset.inst = inst.id;
      cell.dataset.step = i;

      if (grid[inst.id][i]) {
        cell.classList.add('active');
        cell.style.backgroundColor = inst.color;
      }

      cell.addEventListener('click', () => {
        grid[inst.id][i] = grid[inst.id][i] ? 0 : 1;
        if (grid[inst.id][i]) {
          cell.classList.add('active');
          cell.style.backgroundColor = inst.color;
          playSound(inst.id);
        } else {
          cell.classList.remove('active');
          cell.style.backgroundColor = '';
        }
      });

      cells.appendChild(cell);
    }

    row.appendChild(cells);
    container.appendChild(row);
  });
}

// ===== Refresh Grid UI from data =====
function refreshGridUI(container, grid) {
  INSTRUMENTS.forEach(inst => {
    for (let i = 0; i < STEPS; i++) {
      const cell = container.querySelector(`[data-inst="${inst.id}"][data-step="${i}"]`);
      if (!cell) continue;
      if (grid[inst.id][i]) {
        cell.classList.add('active');
        cell.style.backgroundColor = inst.color;
      } else {
        cell.classList.remove('active');
        cell.style.backgroundColor = '';
      }
    }
  });
}

// ===== Playback Highlight =====
function highlightStep(container, step) {
  // Remove previous highlights
  container.querySelectorAll('.current-step').forEach(cell => {
    cell.classList.remove('current-step');
    cell.classList.remove('cell-pop');
  });

  if (step < 0) return;

  // Add highlight to current column
  container.querySelectorAll(`[data-step="${step}"]`).forEach(cell => {
    cell.classList.add('current-step');
    if (cell.classList.contains('active')) {
      cell.classList.add('cell-pop');
    }
  });
}

function clearStepHighlight() {
  document.querySelectorAll('.current-step').forEach(cell => {
    cell.classList.remove('current-step');
    cell.classList.remove('cell-pop');
  });
}

// ===== Load Song =====
async function loadSong(songId, grid, bpm) {
  try {
    const song = await getSong(songId);
    if (!song) return null;

    // Apply song data to grid
    INSTRUMENTS.forEach(inst => {
      if (song.grid && song.grid[inst.id]) {
        for (let i = 0; i < STEPS; i++) {
          grid[inst.id][i] = song.grid[inst.id][i] || 0;
        }
      }
    });

    return song;
  } catch {
    return null;
  }
}

// ===== Save Modal =====
function showSaveModal(container, currentName, onSave) {
  const defaultName = currentName || `おんがく ${getNextSongNumber()}`;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-title">なまえをつけてね</div>
      <input type="text" class="modal-input" id="modal-name-input"
             value="${defaultName}" maxlength="20">
      <div class="modal-buttons">
        <button class="btn btn-modal-cancel" id="modal-cancel">やめる</button>
        <button class="btn btn-modal-ok" id="modal-ok">ほぞん</button>
      </div>
    </div>
  `;

  container.appendChild(overlay);

  const input = document.getElementById('modal-name-input');
  input.focus();
  input.select();

  function close() {
    overlay.remove();
  }

  document.getElementById('modal-cancel').addEventListener('click', close);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.getElementById('modal-ok').addEventListener('click', () => {
    const name = input.value.trim() || defaultName;
    close();
    onSave(name);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const name = input.value.trim() || defaultName;
      close();
      onSave(name);
    }
  });
}

// ===== Message Toast =====
function showMessage(container, text) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-message">${text}</div>
      <div class="modal-buttons">
        <button class="btn btn-modal-ok" id="modal-msg-ok">OK</button>
      </div>
    </div>
  `;

  container.appendChild(overlay);

  function close() {
    overlay.remove();
  }

  document.getElementById('modal-msg-ok').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Auto-close after 2 seconds
  setTimeout(close, 2000);
}
