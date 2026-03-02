// ===== Title Screen =====
import { getAudioContext } from './audio.js';

export function renderTitle(container) {
  container.innerHTML = `
    <div class="screen title-screen">
      <div class="title-content">
        <div class="title-emoji">\u{1F3B5}\u{1F3B6}\u{1F3B5}</div>
        <h1 class="title-text">じゆうに<br>おんがく！</h1>
        <div class="title-notes">\u{1F941}\u{1F514}\u{1F44F}\u2B50\u{1F3B8}\u{1F3B6}</div>
        <div class="title-buttons">
          <button class="btn btn-start" id="btn-start">かいし</button>
          <button class="btn btn-gallery" id="btn-gallery">ぎゃらりー</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-start').addEventListener('click', () => {
    // Initialize AudioContext on user gesture
    getAudioContext();
    window.location.hash = '#/game';
  });

  document.getElementById('btn-gallery').addEventListener('click', () => {
    getAudioContext();
    window.location.hash = '#/gallery';
  });
}
