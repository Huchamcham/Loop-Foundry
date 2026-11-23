const Sequencer = (() => {
  const STEPS = 16;
  const LENGTHS = [1, 2, 4];
  const originalTracks = ['Kick', 'Snare', 'Hi-hat', 'Clap'];
  const addedTracks = ['Open hi-hat', 'Rimshot', 'Low tom', 'Shaker', 'Cowbell', 'Crash'];
  const tracks = [...originalTracks, ...addedTracks];
  const NORMAL = 1;
  const ACCENT = 2;
  const presets = [
    { name: 'House', family: 'Originals', tempo: 112, swing: 0, bars: [
      ['x--- x--- x--- x---', '---- x--- ---- x---', '--x- --x- --x- --x-', '---- x--- ---- x---'],
    ] },
    { name: 'Half time', family: 'Originals', tempo: 88, swing: 0, bars: [
      ['x--- --x- ---x ----', '---- ---- x--- ----', 'x-x- x-x- x-x- xxxx', '---- ---- x--- ----'],
    ] },
    { name: 'Breakbeat', family: 'Originals', tempo: 132, swing: 0, bars: [
      ['x--x ---- x-x- ----', '---- x--x ---- x---', 'x-x- x-x- -x-x -x-x', '---- ---- ---- x--x'],
    ] },
    { name: 'Deep House', family: 'Club', tempo: 122, swing: 15, bars: [
      ['X--- X--- X--- X---', '---- x--- ---- x---', '--X- --x- --X- --xx', '---- X--- ---- X---'],
      ['X--- X--- X--- X--x', '---- x--- ---x x---', '--X- -xx- --X- x-xx', '---- X--- ---- X---'],
    ] },
    { name: 'Warehouse Techno', family: 'Club', tempo: 140, swing: 4, bars: [
      ['X--- X--- X--- X---', '---- ---x ---- ---x', 'x-X- xxX- x-X- xxXx', '---- X--- ---- X---'],
    ] },
    { name: 'Electro', family: 'Club', tempo: 124, swing: 8, bars: [
      ['X--x ---- --x- -x--', '---- X--- ---x X---', 'x-x- x-X- x-xx x-X-', '---- x--- ---- X---'],
      ['X--x --x- X--- ---x', '---- X--- ---- X-x-', 'x-x- x-X- x-xx xxxX', '---- x--- ---- X---'],
    ] },
    { name: 'UK Garage', family: 'Breaks & Bass', tempo: 132, swing: 24, bars: [
      ['X--- --x- -X-- ---x', '---- X--- ---- X---', 'x-x- -xx- x-xx -xx-', '---- x--- ---- x---'],
      ['X--- ---x --X- ----', '---- X--- --x- X---', 'x-x- -xx- xx-x -xxX', '---- x--- ---- X---'],
    ] },
    { name: 'Drum & Bass', family: 'Breaks & Bass', tempo: 174, swing: 4, bars: [
      ['X--- ---- --x- ----', '---- X--- ---- X---', 'x-x- x-x- x-x- x-x-', '---- ---- ---- x---'],
      ['X--- ---- --x- ---x', '---- X--- ---- X---', 'x-x- xxX- x-x- x-xx', '---- ---- ---- x---'],
      ['X--- ---- --x- ----', '---- X--- ---- X---', 'x-x- x-x- x-x- x-x-', '---- ---- ---- x---'],
      ['X--- ---x -xx- ----', '---- X--- ---- XxxX', 'x-x- x-x- x-xx xxxX', '---- ---- ---- x---'],
    ] },
    { name: 'Jungle', family: 'Breaks & Bass', tempo: 164, swing: 10, bars: [
      ['X--- --x- X--x ----', '---- X--x ---- X--x', 'x-x- -xX- xx-x x-X-', '---- ---- ---- x---'],
      ['X--x ---- --x- X---', '---- X--- -x-x --Xx', 'xx-x x-X- xx-x x-xx', '---- ---- ---- --x-'],
    ] },
    { name: 'Boom Bap', family: 'Hip-hop', tempo: 91, swing: 27, bars: [
      ['X--x ---- X-x- ----', '---- X--- ---- X---', 'x-x- x-X- x-x- x-X-', '---- x--- ---- ----'],
      ['X--x --x- X--- -x--', '---- X--- ---x X---', 'x-x- x-X- xx-x x-Xx', '---- ---- ---- x---'],
    ] },
    { name: 'Lo-fi', family: 'Hip-hop', tempo: 76, swing: 32, bars: [
      ['X--- --x- ---x ----', '---- x--- ---- X---', 'x--- --x- x--x --x-', '---- ---- ---- x---'],
    ] },
    { name: 'Trap', family: 'Hip-hop', tempo: 144, swing: 6, bars: [
      ['X--- --x- ---X --x-', '---- ---- X--- ----', 'x-x- x-x- x-x- xxXx', '---- ---- X--- ----'],
      ['X--x ---- -X-- ---x', '---- ---- X--- ----', 'x-x- xxxX x-x- Xxxx', '---- ---- X--- ---x'],
    ] },
    { name: 'Pocket Funk', family: 'Groove', tempo: 102, swing: 16, bars: [
      ['X--x --x- X--- --x-', '---- X--x ---- X---', 'X-x- x-xx X-x- x-xx', '---- ---- ---- x---'],
      ['X--- -xx- X--x ----', '---- X--- -x-- X--x', 'X-xx x-x- X-xx x-Xx', '---- ---- ---- x---'],
    ] },
    { name: 'Disco', family: 'Groove', tempo: 118, swing: 7, bars: [
      ['X--- x--- X--- x---', '---- X--- ---- X---', 'x-X- x-xx x-X- x-xx', '---- x--- ---- X---'],
    ] },
    { name: 'Dembow', family: 'Groove', tempo: 96, swing: 2, bars: [
      ['X--- x--- X--- x---', '---X --x- ---X --x-', 'x-x- x-x- x-x- x-x-', '---x ---- ---x ----'],
      ['X--- x--- X--- x--x', '---X --x- ---X --x-', 'x-x- x-xx x-x- xxXx', '---x ---- ---x ----'],
    ] },
  ];

  const percussion = {
    'House': [
      { 'Open hi-hat': '---- --x- ---- --x-', Shaker: '-x-x -x-x -x-x -x-x' },
    ],
    'Half time': [
      { Rimshot: '---- ---x ---- ---x', 'Low tom': '---- ---- ---- --X-' },
    ],
    'Breakbeat': [
      { 'Open hi-hat': '---- ---- -X-- ----', Rimshot: '---- ---- ---x ----', Crash: 'x--- ---- ---- ----' },
    ],
    'Deep House': [
      { 'Open hi-hat': '--x- ---- --x- ----', Shaker: '-x-x -x-x -x-x -x-x' },
      { 'Open hi-hat': '--x- ---- --x- --X-', Shaker: '-x-x -x-x -x-x -xxx', 'Low tom': '---- ---- ---- -x--' },
    ],
    'Warehouse Techno': [
      { 'Open hi-hat': '--x- --X- --x- --X-', Rimshot: '---x ---x ---x ---x', 'Low tom': '---- ---- ---- -x--' },
    ],
    'Electro': [
      { Cowbell: '--X- ---- --x- -x--', Rimshot: '---x ---- ---- ----' },
      { Cowbell: '--X- ---- ---x --x-', Rimshot: '---x ---- -x-- ----', 'Low tom': '---- ---- ---- ---X' },
    ],
    'UK Garage': [
      { Shaker: '-x-x x--x -x-- x--x', Rimshot: '---- --x- ---- ---x' },
      { Shaker: '-x-x x--x -x-- x-xx', Rimshot: '---- --x- -x-- ----', 'Open hi-hat': '---- ---- ---- --X-' },
    ],
    'Drum & Bass': [
      { 'Open hi-hat': '---- --x- ---- --x-', Crash: 'X--- ---- ---- ----' },
      { 'Open hi-hat': '---- --x- ---- --x-', Rimshot: '---- ---- ---- ---x' },
      { 'Open hi-hat': '---- --x- ---- --x-' },
      { 'Open hi-hat': '---- --x- ---- ----', 'Low tom': '---- ---- ---- -xxX' },
    ],
    'Jungle': [
      { Crash: 'x--- ---- ---- ----', Rimshot: '---- --x- ---- x---' },
      { 'Open hi-hat': '--x- ---- ---- --X-', 'Low tom': '---- ---- -x-- ---x' },
    ],
    'Boom Bap': [
      { Rimshot: '---- ---x ---- ----', Shaker: '-x-- ---x -x-- ---x' },
      { Rimshot: '---- ---x ---- --x-', Shaker: '-x-- ---x -x-- ---x' },
    ],
    'Lo-fi': [
      { Rimshot: '---- ---x --x- ----', Shaker: '---x -x-- ---x -x--' },
    ],
    'Trap': [
      { 'Open hi-hat': '---- --x- ---- ----', Cowbell: '---- ---- --x- ----' },
      { 'Open hi-hat': '---- ---- --x- ----', Cowbell: '---- ---x ---- ----', 'Low tom': '---- ---- ---- ---X' },
    ],
    'Pocket Funk': [
      { Rimshot: '---- --x- ---- ---x', Cowbell: '--x- ---- --x- ----', Shaker: '-x-x -x-x -x-x -x-x' },
      { Rimshot: '---- --x- ---x ----', Cowbell: '--x- ---- ---- --x-', Shaker: '-x-x -x-x -x-x -xxx' },
    ],
    'Disco': [
      { 'Open hi-hat': '--X- --x- --X- --x-', Shaker: '-x-x -x-x -x-x -x-x', Cowbell: '---- --x- ---- --x-' },
    ],
    'Dembow': [
      { Cowbell: 'x--- --X- x--- --X-', Shaker: '-x-x -x-x -x-x -x-x', Rimshot: '---- -x-- ---- -x--' },
      { Cowbell: 'x--- --X- x--x --X-', Shaker: '-x-x -x-x -x-x -xxx', Rimshot: '---- -x-- ---- -x--' },
    ],
  };

  const copyBar = (bar) => bar.map((track) => [...track]);
  const blankBar = () => tracks.map(() => Array(STEPS).fill(0));
  const defaultMix = () => tracks.map(() => ({ volume: 100, muted: false, solo: false }));

  function parseBar(bar) {
    return bar.map((line) => {
      const steps = line.replaceAll(' ', '');
      if (steps.length !== STEPS || /[^xX-]/.test(steps)) throw new Error('Invalid preset rhythm.');
      return [...steps].map((step) => step === 'X' ? ACCENT : step === 'x' ? NORMAL : 0);
    });
  }

  function fromPreset(name) {
    const { tempo, swing, bars } = presets.find((preset) => preset.name === name);
    const arrangement = bars.map((bar, index) => parseBar([
      ...bar,
      ...addedTracks.map((track) => percussion[name][index][track] ?? '----------------'),
    ]));
    return { version: 3, tempo, swing, length: bars.length, bars: arrangement, mix: defaultMix(), master: 100, preset: name };
  }

  function resize(project, length) {
    while (project.bars.length < length) project.bars.push(copyBar(project.bars.at(-1)));
    project.length = length;
  }

  function stepSeconds(step, tempo, swing) {
    return 15 / tempo * (1 + (step % 2 === 0 ? swing : -swing));
  }

  function mixerLevels(mix) {
    const anySolo = mix.some((track) => track.solo);
    return mix.map(({ volume, muted, solo }) => muted || (anySolo && !solo) ? 0 : volume / 100);
  }

  function validNumber(value, min, max) {
    return Number.isInteger(value) && value >= min && value <= max;
  }

  function isBar(bar, trackCount, isStep) {
    return Array.isArray(bar) && bar.length === trackCount && bar.every((row) =>
      Array.isArray(row) && row.length === STEPS && row.every(isStep)
    );
  }

  function readProject(value) {
    const legacy = value?.version === 2;
    const trackCount = legacy ? originalTracks.length : tracks.length;
    if (!value || (!legacy && value.version !== 3) || !validNumber(value.tempo, 60, 180) || !validNumber(value.swing, 0, 50)
        || !LENGTHS.includes(value.length) || !Array.isArray(value.bars) || value.bars.length < value.length || value.bars.length > 4
        || !value.bars.every((bar) => isBar(bar, trackCount, (step) => validNumber(step, 0, ACCENT)))
        || !validNumber(value.master, 0, 100) || !Array.isArray(value.mix) || value.mix.length !== trackCount
        || !value.mix.every((track) => track && validNumber(track.volume, 0, 100) && typeof track.muted === 'boolean' && typeof track.solo === 'boolean')) {
      throw new Error('Choose a valid Loop Foundry project JSON file.');
    }
    return {
      version: 3, tempo: value.tempo, swing: value.swing, length: value.length,
      bars: value.bars.map((bar) => [...copyBar(bar), ...blankBar().slice(trackCount)]), master: value.master,
      mix: [...value.mix.map(({ volume, muted, solo }) => ({ volume, muted, solo })), ...defaultMix().slice(trackCount)],
      preset: !legacy && presets.some(({ name }) => name === value.preset) ? value.preset : '',
    };
  }

  function migrateProject(value) {
    if (!value || !isBar(value.active, originalTracks.length, (step) => typeof step === 'boolean')) return null;
    const project = fromPreset('House');
    project.bars[0] = [...value.active.map((row) => row.map(Number)), ...blankBar().slice(originalTracks.length)];
    project.preset = '';
    if (Number.isFinite(value.tempo)) project.tempo = Math.round(Math.max(60, Math.min(180, value.tempo)));
    if (validNumber(value.swing, 0, 50)) project.swing = value.swing;
    if (Array.isArray(value.muted)) project.mix.forEach((track, i) => { track.muted = value.muted[i] === true; });
    return project;
  }

  function wav(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const tag = (offset, value) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
    tag(0, 'RIFF');
    view.setUint32(4, buffer.byteLength - 8, true);
    tag(8, 'WAVE');
    tag(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    tag(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    samples.forEach((sample, i) => {
      const value = Math.max(-1, Math.min(1, sample));
      view.setInt16(44 + i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true);
    });
    return buffer;
  }

  return { STEPS, LENGTHS, tracks, presets, NORMAL, ACCENT, fromPreset, blankBar, copyBar, resize, stepSeconds, mixerLevels, readProject, migrateProject, wav };
})();

if (typeof module !== 'undefined') module.exports = Sequencer;
