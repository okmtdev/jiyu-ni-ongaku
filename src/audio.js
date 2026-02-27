// ===== Web Audio API Sound Engine =====

let audioCtx = null;

export function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const STEPS = 16;

export const INSTRUMENTS = [
  { id: 'taiko', name: 'たいこ', emoji: '\u{1F941}', color: '#FF6B6B' },
  { id: 'suzu',  name: 'すず',   emoji: '\u{1F514}', color: '#FFD93D' },
  { id: 'pan',   name: 'ぱん',   emoji: '\u{1F44F}', color: '#6BCB77' },
  { id: 'piko',  name: 'ぴこ',   emoji: '\u2B50',    color: '#4D96FF' },
  { id: 'poron', name: 'ぽろん', emoji: '\u{1F3B8}', color: '#FF6FB7' },
  { id: 'shara', name: 'しゃら', emoji: '\u{1F3B6}', color: '#C084FC' },
  { id: 'pyu',   name: 'ぷー',   emoji: '\u{1F3BA}', color: '#FF9F43' },
  { id: 'ton',   name: 'とん',   emoji: '\u270A',    color: '#A0855B' },
  { id: 'rin',   name: 'りん',   emoji: '\u{1F48E}', color: '#00CEC9' },
];

// ===== Create an empty grid =====
export function createEmptyGrid() {
  const grid = {};
  INSTRUMENTS.forEach(inst => {
    grid[inst.id] = new Array(STEPS).fill(0);
  });
  return grid;
}

// ===== Noise buffer helper =====
function createNoiseBuffer(ctx, duration) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// ===== Instrument sound functions =====

function playTaiko(ctx, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.25);
  gain.gain.setValueAtTime(0.8, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.35);
}

function playSuzu(ctx, time) {
  const freqs = [800, 1200, 1500];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.3 / (i + 1), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.55);
  });
}

function playPan(ctx, time) {
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, 0.12);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  filter.Q.value = 1.0;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.7, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(time);
}

function playPiko(ctx, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(660, time);
  osc.frequency.setValueAtTime(880, time + 0.05);
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.15);
}

function playPoron(ctx, time) {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(330, time);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(660, time);
  gain.gain.setValueAtTime(0.4, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc2.start(time);
  osc.stop(time + 0.45);
  osc2.stop(time + 0.45);
}

function playShara(ctx, time) {
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, 0.18);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.35, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(time);
}

function playPyu(ctx, time) {
  // Horn / trumpet-like brass sound
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, time);
  osc.frequency.linearRampToValueAtTime(240, time + 0.05);
  osc.frequency.setValueAtTime(220, time + 0.05);
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(221, time);
  gain.gain.setValueAtTime(0.15, time);
  gain.gain.setValueAtTime(0.2, time + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, time);
  filter.frequency.linearRampToValueAtTime(1200, time + 0.03);
  filter.frequency.linearRampToValueAtTime(600, time + 0.35);
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc2.start(time);
  osc.stop(time + 0.4);
  osc2.stop(time + 0.4);
}

function playTon(ctx, time) {
  // Wood block / knock sound
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, time);
  osc.frequency.exponentialRampToValueAtTime(200, time + 0.06);
  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.1);
  // Add click attack
  const click = ctx.createBufferSource();
  click.buffer = createNoiseBuffer(ctx, 0.01);
  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 3000;
  clickFilter.Q.value = 2;
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.5, time);
  clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
  click.connect(clickFilter);
  clickFilter.connect(clickGain);
  clickGain.connect(ctx.destination);
  click.start(time);
}

function playRin(ctx, time) {
  // Triangle / chime - high metallic ring
  const freqs = [2000, 3000, 5000];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.2 / (i + 1), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.85);
  });
}

const soundFunctions = {
  taiko: playTaiko,
  suzu: playSuzu,
  pan: playPan,
  piko: playPiko,
  poron: playPoron,
  shara: playShara,
  pyu: playPyu,
  ton: playTon,
  rin: playRin,
};

// ===== Play a single instrument sound =====
export function playSound(instrumentId) {
  const ctx = getAudioContext();
  const fn = soundFunctions[instrumentId];
  if (fn) fn(ctx, ctx.currentTime);
}

// ===== Sequencer Playback =====
let playbackState = null;

export function startPlayback(grid, bpm, onStep, loop = true) {
  stopPlayback();
  const stepDuration = (60 / bpm) / 4 * 1000; // ms per 16th note
  let step = 0;

  playbackState = { playing: true, timerId: null };

  const tick = () => {
    if (!playbackState || !playbackState.playing) return;

    // Play active instruments at this step
    INSTRUMENTS.forEach(inst => {
      if (grid[inst.id] && grid[inst.id][step]) {
        playSound(inst.id);
      }
    });

    onStep(step);
    step++;

    if (step >= STEPS) {
      if (loop) {
        step = 0;
      } else {
        playbackState.timerId = setTimeout(() => {
          stopPlayback();
          onStep(-1);
        }, stepDuration);
        return;
      }
    }

    playbackState.timerId = setTimeout(tick, stepDuration);
  };

  tick();
}

export function stopPlayback() {
  if (playbackState) {
    playbackState.playing = false;
    if (playbackState.timerId) {
      clearTimeout(playbackState.timerId);
    }
    playbackState = null;
  }
}

export function isPlaying() {
  return playbackState !== null && playbackState.playing;
}
