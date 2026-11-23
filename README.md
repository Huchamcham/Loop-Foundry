# Loop Foundry

Loop Foundry is a browser drum machine with ten tracks. Program kick, snare, closed hi-hat, clap, open hi-hat, rimshot, low tom, shaker, cowbell, and crash across up to four bars.

## Make a beat

Open `index.html` in Chrome, Edge, or Firefox. No installation or server is required.

1. Press **Play** to hear House or choose one of 15 presets. Try Electro for cowbell and rimshot, Disco for shaker and open hi-hat, or Drum & Bass for crash and a low-tom fill. Each preset loads its own bars, tempo, and swing. Click a track name to preview its sound.
2. Set the loop length to 1, 2, or 4 bars. Use the bar buttons to choose what you edit. **Copy previous bar** repeats the preceding rhythm so you can add a variation. First-time expansions copy the last available bar, and reducing the loop length keeps the other bars for later.
3. Click a step to toggle a hit. Turn on **Accent** or Shift-click a step to change its emphasis. With a step focused, use the arrow keys to move and Enter or Space to edit it.
4. Set each track's volume, mute it with **M**, or solo it with **S**. You can solo several tracks at once. Use **Master volume** to set the whole mix.
5. Select **Export WAV** to download four bars of the current mix at 44.1 kHz. Shorter patterns repeat to fill the export. **Save project** downloads an editable JSON file, which you can load again with **Open project**.

The editor also saves your current project when browser storage is available. To carry forward a beat from an older release, replace the project files in the same folder and reopen `index.html` in the same browser profile. You can also open previously exported project JSON files. Older beats keep their notes and mix settings and start with six empty tracks for the new sounds.

## Code

`synth.js` generates the ten sounds using oscillators, filtered noise, and gain envelopes. `audio.js` handles playback, mixing, and offline rendering. `sequencer.js` includes the presets, project format, swing timing, and mono 16-bit WAV encoder. Live playback and export share the same sounds, mixer settings, and soft peak limiter.

Run `node --test tests/sequencer.test.cjs` with Node.js to check presets, project migration, mixer rules, swing timing, and WAV encoding.
