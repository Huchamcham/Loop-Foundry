const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tracks, presets, fromPreset, blankBar, resize, stepSeconds, mixerLevels, readProject, migrateProject, wav } = require('../sequencer.js');

test('all presets are valid, distinct arrangements', () => {
  const projects = presets.map(({ name }) => readProject(fromPreset(name)));
  assert.equal(projects.length, 15);
  assert.equal(new Set(projects.map(({ bars }) => JSON.stringify(bars))).size, projects.length);
  assert.ok(projects.every((project) => project.bars.every((bar) => bar.flat().some(Boolean))));
  assert.ok(projects.some(({ length }) => length === 4));
  assert.ok(projects.every((project) => project.bars.some((bar) => bar.slice(4).flat().some(Boolean))));
  const used = tracks.map((_, i) => projects.some((project) => project.bars.some((bar) => bar[i].some(Boolean))));
  assert.equal(used.length, 10);
  assert.ok(used.every(Boolean));
});

test('the original three preset rhythms are preserved', () => {
  const hits = (name) => fromPreset(name).bars[0].slice(0, 4).map((row) => row.flatMap((value, index) => value ? [index] : []));
  assert.deepEqual(hits('House'), [[0, 4, 8, 12], [4, 12], [2, 6, 10, 14], [4, 12]]);
  assert.deepEqual(hits('Half time'), [[0, 6, 11], [8], [0, 2, 4, 6, 8, 10, 12, 13, 14, 15], [8]]);
  assert.deepEqual(hits('Breakbeat'), [[0, 3, 8, 10], [4, 7, 12], [0, 2, 4, 6, 9, 11, 13, 15], [12, 15]]);
});

test('expanding a loop copies isolated bars and shrinking preserves edits', () => {
  const project = fromPreset('House');
  resize(project, 4);
  assert.deepEqual(project.bars[1], project.bars[0]);
  project.bars[1][0][0] = 2;
  assert.equal(project.bars[0][0][0], 1);
  assert.equal(project.bars[2][0][0], 1);
  resize(project, 1);
  resize(project, 4);
  assert.equal(project.bars[1][0][0], 2);
  assert.equal(blankBar().flat().some(Boolean), false);
});

test('mix levels combine volume, mute, and solo', () => {
  const project = fromPreset('House');
  project.mix[0].volume = 65;
  project.mix[1].muted = true;
  assert.deepEqual(mixerLevels(project.mix), [0.65, 0, ...Array(8).fill(1)]);
  project.mix[0].solo = true;
  project.mix[1].solo = true;
  assert.deepEqual(mixerLevels(project.mix), [0.65, ...Array(9).fill(0)]);
});

test('legacy saved beats retain their notes, tempo, swing, and mute settings', () => {
  const active = fromPreset('Breakbeat').bars[0].slice(0, 4).map((row) => row.map(Boolean));
  const project = migrateProject({ active, tempo: 129, swing: 18, muted: [false, true, true, false], preset: '' });
  assert.deepEqual(project.bars[0].slice(0, 4), active.map((row) => row.map(Number)));
  assert.deepEqual(project.bars[0].slice(4), blankBar().slice(4));
  assert.deepEqual(project.mix.map(({ muted }) => muted), [false, true, true, ...Array(7).fill(false)]);
  assert.equal(project.tempo, 129);
  assert.equal(project.swing, 18);
  assert.equal(project.preset, '');
  assert.deepEqual(readProject(JSON.parse(JSON.stringify(project))), project);
  assert.equal(migrateProject({ active: [] }), null);
});

test('four-track project files keep accents, mixer settings, and stored extra bars', () => {
  const current = fromPreset('Deep House');
  current.bars[1][0][1] = 2;
  current.mix[2].volume = 42;
  current.mix[3].solo = true;
  const old = { ...current, version: 2, length: 1, master: 75,
    bars: current.bars.map((bar) => bar.slice(0, 4)), mix: current.mix.slice(0, 4) };
  const expanded = readProject(old);
  assert.equal(expanded.version, 3);
  assert.equal(expanded.length, 1);
  assert.equal(expanded.master, 75);
  assert.deepEqual(expanded.bars.map((bar) => bar.slice(0, 4)), old.bars);
  assert.ok(expanded.bars.every((bar) => bar.length === 10 && bar.slice(4).flat().every((step) => step === 0)));
  assert.deepEqual(expanded.mix.slice(0, 4), old.mix);
  assert.ok(expanded.mix.slice(4).every((track) => track.volume === 100 && !track.muted && !track.solo));
});

test('project imports validate the sequence and preserve custom edits', () => {
  const project = fromPreset('Deep House');
  project.bars[1][0][1] = 2;
  project.mix[0].volume = 55;
  project.master = 80;
  project.preset = '';
  const imported = readProject(JSON.parse(JSON.stringify(project)));
  assert.deepEqual(imported, project);
  imported.bars[1][0][1] = 0;
  assert.equal(project.bars[1][0][1], 2);
  assert.throws(() => readProject({ ...project, length: 4 }), /valid Loop Foundry project/);
  assert.throws(() => readProject({ ...project, tempo: 0 }), /valid Loop Foundry project/);
  assert.throws(() => readProject({ ...project, mix: project.mix.slice(0, 4) }), /valid Loop Foundry project/);
  project.bars[0][0][0] = 5;
  assert.throws(() => readProject(project), /valid Loop Foundry project/);
});

test('swing delays the off-step without changing the total bar length', () => {
  const straight = stepSeconds(0, 120, 0);
  assert.ok(stepSeconds(0, 120, 0.4) > straight);
  assert.ok(stepSeconds(1, 120, 0.4) < straight);
  for (const tempo of [60, 112, 180]) {
    const bar = Array.from({ length: 16 }, (_, step) => stepSeconds(step, tempo, 0.5)).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(bar - 240 / tempo) < 1e-10);
  }
});

test('WAV writes PCM headers and clips samples to the 16-bit range', () => {
  const encoded = Buffer.from(wav([-2, -0.5, 0, 2], 44100));
  assert.equal(encoded.toString('ascii', 0, 4), 'RIFF');
  assert.equal(encoded.toString('ascii', 8, 12), 'WAVE');
  assert.equal(encoded.readUInt16LE(20), 1);
  assert.equal(encoded.readUInt16LE(22), 1);
  assert.equal(encoded.readUInt32LE(24), 44100);
  assert.equal(encoded.readUInt32LE(40), 8);
  assert.deepEqual([44, 46, 48, 50].map((offset) => encoded.readInt16LE(offset)), [-32768, -16384, 0, 32767]);
});
