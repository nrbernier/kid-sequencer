# Rhythm Runners 🐠

A music sequencing game for children. Characters race across the screen; place objects on their paths and each one shakes and plays a sound when a character reaches it.

Four worlds, each with its own soundscape:

- 🌊 **Reef**: dark, muted, long underwater tones
- 🌴 **Jungle**: bright, woody marimba and kalimba
- 🪐 **Space**: 8-bit chiptune bips
- 🏙️ **City**: industrial clangs, bicycle bells and electric piano

Every world has two percussion lanes and two melodic lanes. All notes use the C-major pentatonic scale, so everything always sounds in tune. The chord objects play arpeggios.

## Layout

- `src/RhythmRunners.jsx`: the game (React + [Tone.js](https://tonejs.github.io/))
- `src/audioEngine.js`: all the sounds, effects and the per-world level trims
- `src/pixel.jsx`: the pixel-art sprites (characters, objects, icons) and their palettes
- `tools/loudness/`: checks that every world sounds equally loud
- `docs/`: the published site (`index.html` + bundled `assets/app.js`), served by GitHub Pages

## Edit it

```sh
npm install
npm run dev     # local server with live rebuild
npm run build   # rebuild docs/assets/app.js before committing
```

## Keeping worlds equally loud

After changing any sound, check the loudness balance:

```sh
npm run loudness:build
npx esbuild --servedir=.   # then open http://localhost:8000/tools/loudness/ and click
```

It renders the same pattern in every world and measures perceived loudness (K-weighted, BS.1770), full-range and through a tablet-speaker filter. Adjust `WORLD_TRIM_DB` in `src/audioEngine.js` until the tablet numbers are within about 1 dB.
