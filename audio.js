const LoopAudio = (() => {
  const { STEPS, tracks, ACCENT, mixerLevels, stepSeconds, wav } = Sequencer;
  const masterGain = 0.63;
  const sampleRate = 44100;
  const peakCurve = Float32Array.from({ length: 2049 }, (_, index) => {
    // The input is halved before this curve to leave room for stacked hits.
    const level = index / 512 - 2;
    const magnitude = Math.abs(level);
    return magnitude <= 0.8 ? level : Math.sign(level) * (0.8 + 0.18 * Math.tanh((magnitude - 0.8) / 0.18));
  });

  function applyMix(context, mix, project, fade) {
    const setLevel = (node, level) => {
      if (fade) node.gain.setTargetAtTime(level, context.currentTime, 0.012);
      else node.gain.value = level;
    };
    setLevel(mix.master, masterGain * project.master / 200);
    mixerLevels(project.mix).forEach((level, track) => setLevel(mix.channels[track], level));
  }

  function createMix(context, project) {
    const master = context.createGain();
    const limiter = context.createWaveShaper();
    limiter.curve = peakCurve;
    master.connect(limiter).connect(context.destination);
    const channels = tracks.map(() => {
      const channel = context.createGain();
      channel.connect(master);
      return channel;
    });
    const mix = { master, limiter, channels };
    applyMix(context, mix, project, false);
    return mix;
  }

  function scheduleHit(context, mix, bar, step, time) {
    bar.forEach((row, track) => {
      const hit = row[step];
      if (hit) DrumSynth.play(track, context, mix.channels[track], time, hit === ACCENT ? 1.25 : 1);
    });
  }

  class Player {
    constructor(getProject, onStep) {
      this.getProject = getProject;
      this.onStep = onStep;
      this.context = null;
      this.session = null;
    }

    get playing() { return this.session !== null; }

    async prepare() {
      if (!this.context) this.context = new AudioContext();
      if (this.context.state !== 'running') await this.context.resume();
    }

    async start() {
      await this.prepare();
      this.restart();
    }

    restart() {
      this.stop();
      const session = {
        mix: createMix(this.context, this.getProject()), position: 0,
        nextAt: this.context.currentTime + 0.05, cues: [],
      };
      this.session = session;
      this.schedule(session);
      session.timer = setInterval(() => this.schedule(session), 24);
      this.animate(session);
    }

    stop() {
      const session = this.session;
      if (!session) return;
      this.session = null;
      clearInterval(session.timer);
      cancelAnimationFrame(session.frame);
      session.mix.master.disconnect();
      session.mix.limiter.disconnect();
      this.onStep(null);
    }

    updateMix() {
      if (this.session) applyMix(this.context, this.session.mix, this.getProject(), true);
    }

    async audition(track) {
      await this.prepare();
      const project = this.getProject();
      const level = project.mix[track].volume / 100;
      if (!level || !project.master) return;
      const gain = this.context.createGain();
      const liveMix = this.session?.mix;
      gain.gain.value = liveMix ? level : masterGain * level * project.master / 100;
      gain.connect(liveMix?.master ?? this.context.destination);
      const voice = DrumSynth.play(track, this.context, gain, this.context.currentTime + 0.02);
      voice.addEventListener('ended', () => gain.disconnect(), { once: true });
    }

    schedule(session) {
      const now = this.context.currentTime;
      const project = this.getProject();
      if (session.nextAt < now - 0.12) {
        session.nextAt = now + 0.025;
        session.cues.length = 0;
      }
      while (session.nextAt < now + 0.09) {
        session.position %= project.length * STEPS;
        const bar = Math.floor(session.position / STEPS);
        const step = session.position % STEPS;
        const time = Math.max(session.nextAt, now);
        scheduleHit(this.context, session.mix, project.bars[bar], step, time);
        session.cues.push({ bar, step, time });
        session.nextAt += stepSeconds(step, project.tempo, project.swing / 100);
        session.position++;
      }
    }

    animate(session) {
      if (this.session !== session) return;
      while (session.cues.length && session.cues[0].time <= this.context.currentTime) this.onStep(session.cues.shift());
      session.frame = requestAnimationFrame(() => this.animate(session));
    }
  }

  function canExport(project) {
    const levels = mixerLevels(project.mix);
    return project.master > 0 && project.bars.slice(0, project.length)
      .some((bar) => bar.some((row, track) => levels[track] > 0 && row.some(Boolean)));
  }

  async function renderWav(project, barCount) {
    const secondsPerBar = 240 / project.tempo;
    const leadIn = Math.round(sampleRate * secondsPerBar);
    const frames = Math.round(sampleRate * secondsPerBar * barCount);
    const context = new OfflineAudioContext(1, leadIn + frames, sampleRate);
    const mix = createMix(context, project);
    // Prime the loop with its last bar so drum tails cross the boundary.
    for (let bar = -1; bar < barCount; bar++) {
      const pattern = project.bars[(bar + project.length) % project.length];
      let time = (bar + 1) * secondsPerBar;
      for (let step = 0; step < STEPS; step++) {
        scheduleHit(context, mix, pattern, step, time);
        time += stepSeconds(step, project.tempo, project.swing / 100);
      }
    }
    const rendered = await context.startRendering();
    return wav(rendered.getChannelData(0).subarray(leadIn), sampleRate);
  }

  return { Player, canExport, renderWav };
})();
