const DrumSynth = (() => {
  const buffers = new WeakMap();

  function noise(context) {
    if (buffers.has(context)) return buffers.get(context);
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate), context.sampleRate);
    const samples = buffer.getChannelData(0);
    let state = 18273;
    for (let i = 0; i < samples.length; i++) {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      samples[i] = state / 2147483648 - 1;
    }
    buffers.set(context, buffer);
    return buffer;
  }

  function tone(context, output, time, from, to, length, peak, type = 'sine') {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, time);
    oscillator.frequency.exponentialRampToValueAtTime(to, time + length * 0.34);
    gain.gain.setValueAtTime(peak, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + length);
    oscillator.connect(gain).connect(output);
    oscillator.start(time);
    oscillator.stop(time + length);
    return oscillator;
  }

  function noiseHit(context, output, time, frequency, length, peak, filterType, attack = 0) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = noise(context);
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = 0.8;
    if (attack) {
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(peak, time + attack);
    } else {
      gain.gain.setValueAtTime(peak, time);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, time + length);
    source.connect(filter).connect(gain).connect(output);
    source.start(time);
    source.stop(time + length);
    return source;
  }

  function play(track, context, output, time, velocity = 1) {
    switch (track) {
      case 0:
        return tone(context, output, time, 160, 47, 0.25, 0.8 * velocity);
      case 1:
        tone(context, output, time, 190, 125, 0.11, 0.34 * velocity);
        return noiseHit(context, output, time, 1800, 0.19, 0.59 * velocity, 'highpass');
      case 2:
        return noiseHit(context, output, time, 6800, 0.07, 0.34 * velocity, 'highpass');
      case 3:
        for (const offset of [0, 0.012, 0.026]) noiseHit(context, output, time + offset, 1300, 0.045, 0.52 * velocity, 'bandpass');
        return noiseHit(context, output, time + 0.04, 1300, 0.13, 0.44 * velocity, 'bandpass');
      case 4: // Open hi-hat
        return noiseHit(context, output, time, 7600, 0.46, 0.36 * velocity, 'highpass', 0.003);
      case 5: // Rimshot
        noiseHit(context, output, time, 2700, 0.022, 0.29 * velocity, 'bandpass');
        tone(context, output, time, 1560, 1490, 0.031, 0.15 * velocity);
        return tone(context, output, time, 890, 735, 0.052, 0.31 * velocity);
      case 6: // Low tom
        tone(context, output, time, 302, 189, 0.19, 0.15 * velocity);
        noiseHit(context, output, time, 970, 0.039, 0.21 * velocity, 'bandpass');
        return tone(context, output, time, 153, 91, 0.36, 0.59 * velocity);
      case 7: // Shaker
        noiseHit(context, output, time, 4900, 0.067, 0.20 * velocity, 'bandpass', 0.010);
        return noiseHit(context, output, time + 0.025, 6100, 0.108, 0.30 * velocity, 'bandpass', 0.018);
      case 8: { // Cowbell
        const bell = context.createBiquadFilter();
        bell.type = 'bandpass';
        bell.frequency.value = 1040;
        bell.Q.value = 1.15;
        bell.connect(output);
        tone(context, bell, time, 560, 560, 0.19, 0.28 * velocity, 'square');
        return tone(context, bell, time, 845, 845, 0.265, 0.23 * velocity, 'square');
      }
      case 9: // Crash
        noiseHit(context, output, time, 7600, 0.37, 0.24 * velocity, 'highpass', 0.002);
        return noiseHit(context, output, time, 3800, 0.93, 0.51 * velocity, 'highpass', 0.007);
    }
  }

  return { play };
})();
