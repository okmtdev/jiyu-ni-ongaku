// ===== Gallery Screen =====
import { INSTRUMENTS, STEPS, startPlayback, stopPlayback, isPlaying } from './audio.js';
import {
  getMySongs, getAllSongs, deleteSong, isMySong,
  shareToLine, downloadSong, getSong, isCloudMode
} from './api.js';

export function renderGallery(container) {
  let activeTab = 'mine';
  let playingSongId = null;

  container.innerHTML = `
    <div class="screen gallery-screen">
      <div class="gallery-header">
        <button class="btn btn-back" id="btn-back">\u2190 もどる</button>
      </div>
      <div class="gallery-tabs">
        <button class="tab-btn active" data-tab="mine" id="tab-mine">じぶんの</button>
        <button class="tab-btn" data-tab="everyone" id="tab-everyone">みんなの</button>
      </div>
      <div class="gallery-list" id="gallery-list">
        <div class="loading-spinner">\u{1F3B5}</div>
      </div>
    </div>
  `;

  const listContainer = document.getElementById('gallery-list');

  // Back button
  document.getElementById('btn-back').addEventListener('click', () => {
    stopPlayback();
    window.location.hash = '#/';
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      stopPlayback();
      playingSongId = null;
      activeTab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadSongs();
    });
  });

  // Event delegation on the list (set up once, not per render)
  listContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-id]');
    if (!btn) return;

    const songId = btn.dataset.id;

    // Play
    if (btn.classList.contains('btn-play-song')) {
      if (playingSongId === songId) {
        stopPlayback();
        playingSongId = null;
        btn.textContent = '\u25B6 きく';
        btn.classList.remove('playing');
        const card = btn.closest('.song-card');
        if (card) card.classList.remove('playing');
        clearMiniHighlight(songId);
      } else {
        stopPlayback();
        // Reset all play buttons
        listContainer.querySelectorAll('.btn-play-song').forEach(b => {
          b.textContent = '\u25B6 きく';
          b.classList.remove('playing');
        });
        listContainer.querySelectorAll('.song-card').forEach(c => c.classList.remove('playing'));

        const fullSong = await getSong(songId);
        if (fullSong && fullSong.grid) {
          playingSongId = songId;
          btn.textContent = '\u23F9 とめる';
          btn.classList.add('playing');
          const card = btn.closest('.song-card');
          if (card) card.classList.add('playing');
          startPlayback(fullSong.grid, fullSong.bpm || 120, (step) => {
            highlightMiniStep(songId, step);
            if (step < 0) {
              playingSongId = null;
              btn.textContent = '\u25B6 きく';
              btn.classList.remove('playing');
              if (card) card.classList.remove('playing');
            }
          }, false);
        }
      }
    }

    // Edit
    if (btn.classList.contains('btn-edit-song')) {
      stopPlayback();
      window.location.hash = `#/game/${songId}`;
    }

    // Share to LINE
    if (btn.classList.contains('btn-share-song')) {
      shareToLine(songId, btn.dataset.name);
    }

    // Download
    if (btn.classList.contains('btn-download-song')) {
      const fullSong = await getSong(songId);
      if (fullSong) downloadSong(fullSong);
    }

    // Delete
    if (btn.classList.contains('btn-delete-song')) {
      showDeleteConfirm(container, songId, async () => {
        stopPlayback();
        playingSongId = null;
        await deleteSong(songId);
        loadSongs();
      });
    }
  });

  // Load songs
  async function loadSongs() {
    listContainer.innerHTML = '<div class="loading-spinner">\u{1F3B5}</div>';

    try {
      let songs;
      if (activeTab === 'mine') {
        songs = await getMySongs();
      } else {
        songs = await getAllSongs(30);
      }

      if (!songs || songs.length === 0) {
        renderEmpty(listContainer, activeTab);
        return;
      }

      renderSongList(listContainer, songs);
    } catch {
      listContainer.innerHTML = '<div class="gallery-empty"><div class="gallery-empty-emoji">\u{1F622}</div>よみこめなかったよ</div>';
    }
  }

  // Render empty state
  function renderEmpty(el, tab) {
    if (tab === 'mine') {
      el.innerHTML = `
        <div class="gallery-empty">
          <div class="gallery-empty-emoji">\u{1F3B5}</div>
          まだ おんがくが ないよ<br>つくってみよう！
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="gallery-empty">
          <div class="gallery-empty-emoji">\u{1F3B6}</div>
          ${isCloudMode() ? 'まだ おんがくが ないよ' : 'クラウドに つないでね'}
        </div>
      `;
    }
  }

  // Render song list (DOM only, no event listeners)
  function renderSongList(el, songs) {
    el.innerHTML = '';

    songs.forEach(song => {
      const card = document.createElement('div');
      card.className = 'song-card';
      card.dataset.songId = song.id;

      const date = song.createdAt
        ? new Date(song.createdAt).toLocaleDateString('ja-JP')
        : '';

      const isMine = isMySong(song.id);
      const bpmText = song.bpm ? `BPM ${song.bpm}` : '';

      card.innerHTML = `
        <div class="song-info">
          <span class="song-name">${escapeHtml(song.name || 'おんがく')}</span>
          <span class="song-date">${date}</span>
        </div>
        <div class="song-meta">
          <span>${bpmText}</span>
        </div>
        ${song.grid ? renderMiniGrid(song.grid, song.id) : ''}
        <div class="song-actions">
          <button class="btn-sm btn-play-song" data-id="${song.id}">\u25B6 きく</button>
          <button class="btn-sm btn-edit-song" data-id="${song.id}">\u270F\uFE0F へんしゅう</button>
          ${isMine ? `
            <button class="btn-sm btn-share-song" data-id="${song.id}" data-name="${escapeAttr(song.name || 'おんがく')}">LINE</button>
            <button class="btn-sm btn-download-song" data-id="${song.id}">\u{1F4E5}</button>
            <button class="btn-sm btn-delete-song" data-id="${song.id}">\u{1F5D1} けす</button>
          ` : ''}
        </div>
      `;

      el.appendChild(card);
    });
  }

  // Initial load
  loadSongs();
}

// ===== Mini Grid Visualization =====
function renderMiniGrid(grid, songId) {
  let html = `<div class="mini-grid" data-mini-grid="${songId}">`;
  INSTRUMENTS.forEach(inst => {
    html += '<div class="mini-row">';
    html += `<span class="mini-label">${inst.emoji}</span>`;
    const steps = grid[inst.id] || [];
    for (let i = 0; i < STEPS; i++) {
      const active = steps[i] ? 'active' : '';
      const bg = steps[i] ? `background-color:${inst.color}` : '';
      html += `<div class="mini-cell ${active}" data-mini-step="${i}" data-mini-inst="${inst.id}" style="${bg}"></div>`;
    }
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function highlightMiniStep(songId, step) {
  const miniGrid = document.querySelector(`[data-mini-grid="${songId}"]`);
  if (!miniGrid) return;
  miniGrid.querySelectorAll('.current-step').forEach(c => c.classList.remove('current-step'));
  if (step >= 0) {
    miniGrid.querySelectorAll(`[data-mini-step="${step}"]`).forEach(c => {
      c.classList.add('current-step');
    });
  }
}

function clearMiniHighlight(songId) {
  const miniGrid = document.querySelector(`[data-mini-grid="${songId}"]`);
  if (miniGrid) {
    miniGrid.querySelectorAll('.current-step').forEach(c => c.classList.remove('current-step'));
  }
}

// ===== Delete Confirmation =====
function showDeleteConfirm(container, songId, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-message">ほんとうに けす？</div>
      <div class="modal-buttons">
        <button class="btn btn-modal-cancel" id="del-cancel">やめる</button>
        <button class="btn btn-modal-ok" id="del-ok" style="background:#FF6B6B;box-shadow:0 4px 0 #D63031;">けす</button>
      </div>
    </div>
  `;

  container.appendChild(overlay);

  function close() {
    overlay.remove();
  }

  document.getElementById('del-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.getElementById('del-ok').addEventListener('click', () => {
    close();
    onConfirm();
  });
}

// ===== Utilities =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
