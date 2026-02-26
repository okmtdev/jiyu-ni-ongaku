// ===== API Module =====
// Supports Cloud Function backend with localStorage fallback

// Set this to your Cloud Function URL to enable cloud storage.
// If empty, uses localStorage only.
const API_URL = window.__API_URL || '';

// ===== Author ID Management =====
export function getAuthorId() {
  let id = localStorage.getItem('ongaku_authorId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('ongaku_authorId', id);
  }
  return id;
}

function getMySongIds() {
  try {
    return JSON.parse(localStorage.getItem('ongaku_mySongIds') || '[]');
  } catch {
    return [];
  }
}

function addMySongId(id) {
  const ids = getMySongIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem('ongaku_mySongIds', JSON.stringify(ids));
  }
}

function removeMySongId(id) {
  const ids = getMySongIds().filter(i => i !== id);
  localStorage.setItem('ongaku_mySongIds', JSON.stringify(ids));
}

export function isMySong(songId) {
  return getMySongIds().includes(songId);
}

// ===== LocalStorage Backend =====
function localSave(song) {
  localStorage.setItem(`ongaku_song_${song.id}`, JSON.stringify(song));
  addMySongId(song.id);
}

function localGet(id) {
  const data = localStorage.getItem(`ongaku_song_${id}`);
  return data ? JSON.parse(data) : null;
}

function localDelete(id) {
  localStorage.removeItem(`ongaku_song_${id}`);
  removeMySongId(id);
}

function localListMy() {
  const ids = getMySongIds();
  const songs = [];
  ids.forEach(id => {
    const song = localGet(id);
    if (song) songs.push(song);
  });
  return songs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function localListAll() {
  // In local mode, we can only see our own songs
  return localListMy();
}

// ===== Cloud Backend =====
async function cloudSave(song) {
  const res = await fetch(`${API_URL}/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(song),
  });
  if (!res.ok) throw new Error('Save failed');
  addMySongId(song.id);
  return await res.json();
}

async function cloudGet(id) {
  const res = await fetch(`${API_URL}/songs/${id}`);
  if (!res.ok) throw new Error('Load failed');
  return await res.json();
}

async function cloudDelete(id) {
  const res = await fetch(`${API_URL}/songs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  removeMySongId(id);
}

async function cloudListMy() {
  const authorId = getAuthorId();
  const res = await fetch(`${API_URL}/songs?authorId=${authorId}`);
  if (!res.ok) throw new Error('List failed');
  return await res.json();
}

async function cloudListAll(limit = 30) {
  const res = await fetch(`${API_URL}/songs?limit=${limit}`);
  if (!res.ok) throw new Error('List failed');
  return await res.json();
}

// ===== Public API =====
function useCloud() {
  return API_URL.length > 0;
}

export async function saveSong(songData) {
  const id = songData.id || crypto.randomUUID();
  const song = {
    ...songData,
    id,
    authorId: getAuthorId(),
    createdAt: songData.createdAt || new Date().toISOString(),
  };

  if (useCloud()) {
    try {
      await cloudSave(song);
    } catch {
      // Fallback to local
      localSave(song);
    }
  } else {
    localSave(song);
  }

  // Always keep a local copy
  localSave(song);
  return song;
}

export async function getSong(id) {
  if (useCloud()) {
    try {
      return await cloudGet(id);
    } catch {
      return localGet(id);
    }
  }
  return localGet(id);
}

export async function deleteSong(id) {
  if (useCloud()) {
    try {
      await cloudDelete(id);
    } catch {
      // continue to local delete
    }
  }
  localDelete(id);
}

export async function getMySongs() {
  if (useCloud()) {
    try {
      return await cloudListMy();
    } catch {
      return localListMy();
    }
  }
  return localListMy();
}

export async function getAllSongs(limit = 30) {
  if (useCloud()) {
    try {
      return await cloudListAll(limit);
    } catch {
      return localListAll();
    }
  }
  return localListAll();
}

export function isCloudMode() {
  return useCloud();
}

// ===== Share Utilities =====
export function getShareUrl(songId) {
  const base = window.location.origin + window.location.pathname;
  return `${base}#/play/${songId}`;
}

export function shareToLine(songId, songName) {
  const url = getShareUrl(songId);
  const text = `${songName || 'おんがく'} をきいてね！\n${url}`;
  window.open(
    `https://line.me/R/share?text=${encodeURIComponent(text)}`,
    '_blank'
  );
}

export function downloadSong(song) {
  const data = JSON.stringify(song, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${song.name || 'ongaku'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== Song count for naming =====
export function getNextSongNumber() {
  return getMySongIds().length + 1;
}
