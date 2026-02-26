// ===== Main App - Router =====
import { renderTitle } from './title.js';
import { renderGame } from './game.js';
import { renderGallery } from './gallery.js';
import { stopPlayback } from './audio.js';

const app = document.getElementById('app');

function router() {
  const hash = window.location.hash || '#/';

  // Stop any playback when navigating
  stopPlayback();

  // Clear previous screen
  app.innerHTML = '';

  if (hash === '#/' || hash === '' || hash === '#') {
    renderTitle(app);
  } else if (hash === '#/game') {
    renderGame(app);
  } else if (hash.startsWith('#/game/')) {
    const id = hash.slice(7);
    renderGame(app, id);
  } else if (hash === '#/gallery') {
    renderGallery(app);
  } else if (hash.startsWith('#/play/')) {
    const id = hash.slice(7);
    renderGame(app, id, true);
  } else {
    renderTitle(app);
  }
}

window.addEventListener('hashchange', router);

// Initial route
router();
