const { STEPS, LENGTHS, tracks, presets, NORMAL, ACCENT, fromPreset, blankBar, copyBar, resize, readProject, migrateProject } = Sequencer;
const byId = (id) => document.getElementById(id);
const grid = byId('grid');
const tempo = byId('tempo');
const swing = byId('swing');
const master = byId('master');
const playButton = byId('play');
const exportButton = byId('export');
const openButton = byId('open-project');
const projectFile = byId('project-file');
const preset = byId('preset');
const length = byId('length');
const accent = byId('accent');
const storageKey = 'loop-foundry.project.v3';
const stepButtons = [];
const mixControls = [];
const beatNumbers = [];
const barButtons = [];
let editBar = 0;
let accentMode = false;
let playhead = null;
let paintedStep = -1;
let project = restore();

function announce(message) {
  byId('notice').textContent = message;
}

function restore() {
  for (const key of [storageKey, 'loop-foundry.project.v2']) {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return readProject(JSON.parse(saved));
    } catch {}
  }
  try {
    const migrated = migrateProject(JSON.parse(localStorage.getItem('loop-foundry.pattern.v1')));
    if (migrated) return migrated;
  } catch {}
  return fromPreset('House');
}

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(project)); } catch {}
}

function paintSteps() {
  const bar = project.bars[editBar];
  const displayCount = editBar + 1;
  stepButtons.forEach((row, track) => row.forEach((button, step) => {
    const hit = bar[track][step];
    button.dataset.hit = hit;
    button.setAttribute('aria-pressed', String(hit > 0));
    const state = hit === ACCENT ? ', accented' : '';
    button.setAttribute('aria-label', `${tracks[track]}, bar ${displayCount}, step ${step + 1}${state}`);
  }));
}

function paintPlayhead() {
  const step = playhead?.bar === editBar ? playhead.step : -1;
  if (step !== paintedStep) {
    if (paintedStep >= 0) {
      beatNumbers[paintedStep].classList.remove('now');
      stepButtons.forEach((row) => row[paintedStep].classList.remove('now'));
    }
    if (step >= 0) {
      beatNumbers[step].classList.add('now');
      stepButtons.forEach((row) => row[step].classList.add('now'));
    }
    paintedStep = step;
  }
  barButtons.forEach((button, index) => button.classList.toggle('playing', index === playhead?.bar));
  const position = byId('position');
  position.textContent = playhead ? `Bar ${playhead.bar + 1} · Beat ${Math.floor(playhead.step / 4) + 1}`
    : player.playing ? 'Starting…' : 'Stopped';
}

const player = new LoopAudio.Player(() => project, (position) => {
  playhead = position;
  paintPlayhead();
});

function paintEditor() {
  const bar = project.bars[editBar];
  length.value = project.length;
  preset.value = project.preset;
  barButtons.forEach((button, index) => {
    button.hidden = index >= project.length;
    button.setAttribute('aria-pressed', String(index === editBar));
  });
  byId('copy-previous').disabled = editBar === 0;
  byId('clear').disabled = !bar.some((row) => row.some(Boolean));
  paintSteps();
  paintPlayhead();
}

function paintMix() {
  const levels = Sequencer.mixerLevels(project.mix);
  mixControls.forEach(({ volume, value, mute, solo, row }, track) => {
    const settings = project.mix[track];
    volume.value = settings.volume;
    value.textContent = `${settings.volume}%`;
    mute.setAttribute('aria-pressed', String(settings.muted));
    solo.setAttribute('aria-pressed', String(settings.solo));
    row.classList.toggle('quiet', levels[track] === 0);
    stepButtons[track][0].parentElement.classList.toggle('quiet', levels[track] === 0);
  });
  master.value = project.master;
  byId('master-value').textContent = `${project.master}%`;
}

function syncPlayback() {
  playButton.classList.toggle('playing', player.playing);
  byId('play-label').textContent = player.playing ? 'Stop' : 'Play';
  paintPlayhead();
}

function render() {
  tempo.value = project.tempo;
  swing.value = project.swing;
  byId('swing-value').textContent = `${project.swing}%`;
  paintEditor();
  paintMix();
}

function edit(action) {
  action();
  project.preset = '';
  paintEditor();
  save();
}

function mixChanged() {
  player.updateMix();
  paintMix();
  save();
}

function loadProject(next) {
  project = next;
  editBar = 0;
  if (player.playing) player.restart();
  render();
  syncPlayback();
  save();
}

function buildBars() {
  for (let index = 0; index < LENGTHS.at(-1); index++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = index + 1;
    button.setAttribute('aria-label', `Edit bar ${index + 1}`);
    button.addEventListener('click', () => { editBar = index; paintEditor(); });
    barButtons.push(button);
    byId('bars').append(button);
  }
}

function buildPresets() {
  const groups = new Map();
  for (const { name, family } of presets) {
    if (!groups.has(family)) {
      const group = document.createElement('optgroup');
      group.label = family;
      preset.append(group);
      groups.set(family, group);
    }
    groups.get(family).append(new Option(name, name));
  }
}

function buildGrid() {
  const header = document.createElement('div');
  header.className = 'row step-numbers';
  const label = document.createElement('span');
  label.className = 'track-header';
  label.textContent = 'Track';
  header.append(label);
  for (let step = 0; step < STEPS; step++) {
    const count = document.createElement('span');
    count.textContent = step % 4 === 0 ? String(step / 4 + 1) : '·';
    if (step % 4 === 0) count.classList.add('beat');
    beatNumbers.push(count);
    header.append(count);
  }
  grid.append(header);
  tracks.forEach((name, track) => {
    const row = document.createElement('div');
    row.className = `row track track-${track}`;
    const labelButton = document.createElement('button');
    labelButton.type = 'button';
    labelButton.className = 'track-label';
    labelButton.textContent = name;
    labelButton.setAttribute('aria-label', `Preview ${name}`);
    labelButton.title = `Preview ${name}`;
    labelButton.addEventListener('click', () => {
      player.audition(track).catch(() => announce('Audio could not start. Try in a current browser.'));
    });
    row.append(labelButton);
    const steps = [];
    for (let step = 0; step < STEPS; step++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `step${step % 4 === 0 ? ' beat' : ''}`;
      button.dataset.track = track;
      button.dataset.step = step;
      button.tabIndex = track === 0 && step === 0 ? 0 : -1;
      button.addEventListener('focus', () => {
        const previous = grid.querySelector('.step[tabindex="0"]');
        if (previous) previous.tabIndex = -1;
        button.tabIndex = 0;
      });
      button.addEventListener('click', (event) => edit(() => {
        const row = project.bars[editBar][track];
        const hit = row[step];
        row[step] = accentMode || event.shiftKey ? (hit === ACCENT ? NORMAL : ACCENT) : (hit ? 0 : NORMAL);
      }));
      row.append(button);
      steps.push(button);
    }
    stepButtons.push(steps);
    grid.append(row);
  });
}

function buildMixer() {
  const template = byId('mix-template');
  tracks.forEach((name, track) => {
    const row = template.content.firstElementChild.cloneNode(true);
    row.classList.add(`track-${track}`);
    const volume = row.querySelector('input');
    const value = row.querySelector('output');
    const label = row.querySelector('label');
    const mute = row.querySelector('.mute');
    const solo = row.querySelector('.solo');
    volume.id = `volume-${track}`;
    label.htmlFor = volume.id;
    label.textContent = name;
    value.setAttribute('for', volume.id);
    volume.setAttribute('aria-label', `${name} volume`);
    mute.setAttribute('aria-label', `Mute ${name}`);
    solo.setAttribute('aria-label', `Solo ${name}`);
    mute.title = `Mute ${name}`;
    solo.title = `Solo ${name}`;
    volume.addEventListener('input', () => { project.mix[track].volume = Number(volume.value); mixChanged(); });
    mute.addEventListener('click', () => { project.mix[track].muted = !project.mix[track].muted; mixChanged(); });
    solo.addEventListener('click', () => { project.mix[track].solo = !project.mix[track].solo; mixChanged(); });
    mixControls.push({ volume, value, mute, solo, row });
    byId('mix-tracks').append(row);
  });
}

function download(contents, name, type) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

playButton.addEventListener('click', async () => {
  if (player.playing) {
    player.stop();
    syncPlayback();
    return;
  }
  playButton.disabled = true;
  try {
    await player.start();
    announce('');
  } catch {
    player.stop();
    announce('Audio could not start. Try in a current browser.');
  } finally {
    playButton.disabled = false;
    syncPlayback();
  }
});

exportButton.addEventListener('click', async () => {
  if (!LoopAudio.canExport(project)) {
    announce('Add an audible step or raise the mixer level before exporting.');
    return;
  }
  exportButton.disabled = true;
  announce('Rendering WAV…');
  try {
    const bpm = project.tempo;
    const file = await LoopAudio.renderWav(project, 4);
    download(file, `loop-foundry-${bpm}bpm.wav`, 'audio/wav');
    announce('Four-bar WAV downloaded.');
  } catch {
    announce('The WAV could not be exported. Try in a current browser.');
  } finally {
    exportButton.disabled = false;
  }
});

grid.addEventListener('keydown', (event) => {
  if (!event.target.classList.contains('step')) return;
  const arrow = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key];
  if (!arrow) return;
  event.preventDefault();
  const nextTrack = Number(event.target.dataset.track) + arrow[0];
  const nextStep = Number(event.target.dataset.step) + arrow[1];
  stepButtons[nextTrack]?.[nextStep]?.focus();
});
preset.addEventListener('change', () => {
  if (!preset.value) return;
  const next = fromPreset(preset.value);
  next.mix = project.mix;
  next.master = project.master;
  loadProject(next);
  announce(`${next.preset} loaded at ${next.tempo} BPM.`);
});
length.addEventListener('change', () => edit(() => {
  resize(project, Number(length.value));
  editBar = Math.min(editBar, project.length - 1);
}));
accent.addEventListener('click', () => {
  accentMode = !accentMode;
  accent.setAttribute('aria-pressed', String(accentMode));
});
byId('clear').addEventListener('click', () => edit(() => {
  project.bars[editBar] = blankBar();
  announce(`Bar ${editBar + 1} cleared.`);
}));
byId('copy-previous').addEventListener('click', () => edit(() => {
  project.bars[editBar] = copyBar(project.bars[editBar - 1]);
  announce(`Copied bar ${editBar} to bar ${editBar + 1}.`);
}));
tempo.addEventListener('change', () => {
  project.tempo = tempo.value ? Math.round(Math.max(60, Math.min(180, Number(tempo.value)))) : project.tempo;
  tempo.value = project.tempo;
  save();
});
swing.addEventListener('input', () => {
  project.swing = Number(swing.value);
  byId('swing-value').textContent = `${project.swing}%`;
  save();
});
master.addEventListener('input', () => { project.master = Number(master.value); mixChanged(); });
byId('save-project').addEventListener('click', () => {
  download(JSON.stringify(project, null, 2), 'loop-foundry-project.json', 'application/json');
  announce('Project downloaded.');
});
openButton.addEventListener('click', () => projectFile.click());
projectFile.addEventListener('change', async () => {
  const file = projectFile.files[0];
  projectFile.value = '';
  if (!file) return;
  openButton.disabled = true;
  try {
    if (file.size > 64 * 1024) throw new Error('Project is too large. Choose a Loop Foundry project JSON file.');
    const data = JSON.parse(await file.text());
    loadProject(readProject(data));
    announce(`Opened ${file.name}.`);
  } catch (error) {
    announce(error instanceof SyntaxError ? 'Choose a valid Loop Foundry project JSON file.' : error.message);
  } finally {
    openButton.disabled = false;
  }
});

buildPresets();
buildBars();
buildGrid();
buildMixer();
render();
save();
