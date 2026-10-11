import * as Tone from "tone";

/* Per-world level trims (dB) so every world sounds equally loud.
   Measured with tools/loudness (K-weighted loudness of a reference pattern
   rendered offline). Re-run it after changing any sound. */
export const WORLD_TRIM_DB = { aqua: -2.9, jungle: 3.8, space: -2.9, city: 2.4 };

/* ============================================================
   AUDIO ENGINE — one output bus per world:
   🌊 lowpass filter → slow chorus → long, wet reverb  (dark & watery)
   🌴 nearly dry, short bright reverb                  (woody & close)
   🪐 bitcrusher → tempo-synced echo → touch of verb   (8-bit arcade)
   🏙️ light grit → slapback echo → small room          (street & metal)
   Builds in the current Tone context, so it also works inside Tone.Offline.
   ============================================================ */
export async function createEngine(trims = WORLD_TRIM_DB) {
  /* --- master chain: gentle glue compression + brickwall limiter.
     Prevents clipping when several long/low sounds land on the same step --- */
  const masterLimiter = new Tone.Limiter(-1).toDestination();
  const masterComp = new Tone.Compressor({ threshold: -14, ratio: 3, attack: 0.004, release: 0.18 });
  masterComp.connect(masterLimiter);
  const trim = (id) => new Tone.Gain(Tone.dbToGain(trims[id] ?? 0)).connect(masterComp);

  /* --- buses --- */
  const aquaVerb = new Tone.Reverb({ decay: 5.5, wet: 0.4 });
  const aquaChorus = new Tone.Chorus({ frequency: 0.6, delayTime: 4, depth: 0.5, wet: 0.5 }).start();
  const aquaBus = new Tone.Filter(950, "lowpass");
  aquaBus.chain(aquaChorus, aquaVerb, trim("aqua"));

  const jungleVerb = new Tone.Reverb({ decay: 0.9, wet: 0.1 });
  const jungleBus = new Tone.Gain(1);
  jungleBus.chain(jungleVerb, trim("jungle"));

  const spaceVerb = new Tone.Reverb({ decay: 1.4, wet: 0.12 });
  const spaceEcho = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.22, wet: 0.16 });
  const spaceBus = new Tone.BitCrusher(5);
  spaceBus.wet.value = 0.4;
  spaceBus.chain(spaceEcho, spaceVerb, trim("space"));

  const cityVerb = new Tone.Reverb({ decay: 1.8, wet: 0.18 });
  const citySlap = new Tone.FeedbackDelay({ delayTime: "16n", feedback: 0.15, wet: 0.12 });
  const cityBus = new Tone.Distortion(0.3);
  cityBus.wet.value = 0.25;
  cityBus.chain(citySlap, cityVerb, trim("city"));

  await Promise.all([aquaVerb.ready, jungleVerb.ready, spaceVerb.ready, cityVerb.ready]);

  /* --- 🌊 aquatic voices: dark, muted, long --- */
  const deepboom = new Tone.MembraneSynth({
    octaves: 5, pitchDecay: 0.08,
    envelope: { attack: 0.002, decay: 0.7, sustain: 0.01, release: 0.6 },
  }).connect(aquaBus);
  deepboom.volume.value = -7;
  const deeptom = new Tone.MembraneSynth({
    octaves: 2.5, pitchDecay: 0.12,
    envelope: { attack: 0.004, decay: 0.55, sustain: 0.01, release: 0.5 },
  }).connect(aquaBus);
  deeptom.volume.value = -9;
  const blub = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 0.35, sustain: 0, release: 0.25 },
  }).connect(aquaBus);
  blub.volume.value = -9;
  const wash = new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 0.02, decay: 0.35, sustain: 0, release: 0.3 },
  }).connect(aquaBus);
  wash.volume.value = -11;
  const deepPluck = new Tone.PolySynth(Tone.AMSynth, {
    harmonicity: 1.5,
    oscillator: { type: "sine" },
    modulation: { type: "sine" },
    envelope: { attack: 0.02, decay: 0.9, sustain: 0.12, release: 1.6 },
    modulationEnvelope: { attack: 0.4, decay: 0.6, sustain: 0.2, release: 1.2 },
  }).connect(aquaBus);
  deepPluck.volume.value = -8;
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.15, decay: 0.8, sustain: 0.3, release: 2.4 },
  }).connect(aquaBus);
  pad.volume.value = -11;

  /* --- 🌴 jungle voices: bright, dry, woody --- */
  const log = new Tone.MembraneSynth({
    octaves: 2, pitchDecay: 0.025,
    envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
  }).connect(jungleBus);
  log.volume.value = -7;
  const djembe = new Tone.MembraneSynth({
    octaves: 3.5, pitchDecay: 0.015,
    envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
  }).connect(jungleBus);
  djembe.volume.value = -9;
  const block = new Tone.MembraneSynth({
    octaves: 1.2, pitchDecay: 0.005,
    envelope: { attack: 0.001, decay: 0.045, sustain: 0 },
  }).connect(jungleBus);
  block.volume.value = -8;
  const shakerpod = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: 0.04, sustain: 0 },
  }).connect(jungleBus);
  shakerpod.volume.value = -14;
  /* marimba body: partials tuned like a real bar (modes near 1, 4 and 10) */
  const marimba = new Tone.PolySynth(Tone.Synth, {
    oscillator: { partials: [1, 0, 0, 0.5, 0, 0, 0, 0, 0, 0.22] },
    envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.45 },
  }).connect(jungleBus);
  marimba.volume.value = -9;
  /* marimba resonator: warm short-lived low emphasis, like the tube under the bar */
  const marimbaBody = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.002, decay: 0.22, sustain: 0, release: 0.2 },
  }).connect(jungleBus);
  marimbaBody.volume.value = -16;
  /* mallet strike: tiny band-passed noise click at the attack */
  const malletFilter = new Tone.Filter(2400, "bandpass", -12);
  malletFilter.Q.value = 1.2;
  malletFilter.connect(jungleBus);
  const mallet = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.014, sustain: 0 },
  }).connect(malletFilter);
  mallet.volume.value = -16;
  const kalimba = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 8, modulationIndex: 2,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.7, sustain: 0, release: 0.7 },
    modulation: { type: "square" },
    modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 },
  }).connect(jungleBus);
  kalimba.volume.value = -12;

  /* --- 🪐 space voices: pure square-wave 8-bit bips --- */
  const boom8 = new Tone.MembraneSynth({
    octaves: 8, pitchDecay: 0.02,
    oscillator: { type: "square" },
    envelope: { attack: 0.001, decay: 0.14, sustain: 0 },
  }).connect(spaceBus);
  boom8.volume.value = -8;
  const snare8 = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0 },
  }).connect(spaceBus);
  snare8.volume.value = -13;
  const zap = new Tone.MembraneSynth({
    octaves: 4.5, pitchDecay: 0.12,
    oscillator: { type: "square" },
    envelope: { attack: 0.001, decay: 0.16, sustain: 0 },
  }).connect(spaceBus);
  zap.volume.value = -14;
  const tick8 = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.02, sustain: 0 },
  }).connect(spaceBus);
  tick8.volume.value = -16;
  const chip = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "square" },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0.4, release: 0.03 },
  }).connect(spaceBus);
  chip.volume.value = -14;
  const pulse = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "pulse", width: 0.25 },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0.35, release: 0.03 },
  }).connect(spaceBus);
  pulse.volume.value = -15;

  /* --- 🏙️ city voices: industrial metal + street melodies --- */
  /* anvil clang: inharmonic FM ratio = metallic ring */
  const anvil = new Tone.FMSynth({
    harmonicity: 5.07, modulationIndex: 24,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
    modulation: { type: "square" },
    modulationEnvelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 },
  }).connect(cityBus);
  anvil.volume.value = -14;
  /* oil barrel: hollow low thud */
  const barrel = new Tone.MembraneSynth({
    octaves: 4, pitchDecay: 0.05,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.25 },
  }).connect(cityBus);
  barrel.volume.value = -8;
  /* trash-can lid: short bright clank */
  const lid = new Tone.FMSynth({
    harmonicity: 7.4, modulationIndex: 30,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.06 },
    modulation: { type: "square" },
    modulationEnvelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 },
  }).connect(cityBus);
  lid.volume.value = -18;
  /* steam hiss: high-passed white noise (fire hydrant / vapor vent) */
  const hissFilter = new Tone.Filter(3200, "highpass").connect(cityBus);
  const hiss = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.12 },
  }).connect(hissFilter);
  hiss.volume.value = -13;
  /* bicycle bell: shimmering, slightly inharmonic ding */
  const bell = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3.9, modulationIndex: 12,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.55, sustain: 0, release: 0.4 },
    modulation: { type: "sine" },
    modulationEnvelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
  }).connect(cityBus);
  bell.volume.value = -13;
  /* street keys: mellow electric-piano chords from the boombox */
  const keys = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 1, modulationIndex: 3.5,
    oscillator: { type: "sine" },
    envelope: { attack: 0.004, decay: 0.5, sustain: 0.18, release: 0.6 },
    modulation: { type: "sine" },
    modulationEnvelope: { attack: 0.002, decay: 0.3, sustain: 0.05, release: 0.4 },
  }).connect(cityBus);
  keys.volume.value = -12;

  return {
    deepboom, deeptom, blub, wash, deepPluck, pad,
    log, djembe, block, shakerpod, marimba, marimbaBody, mallet, kalimba,
    boom8, snare8, zap, tick8, chip, pulse,
    anvil, barrel, lid, hiss, bell, keys,
  };
}

/* one trigger routine used by sequencer + previews */
export function playItem(A, item, time, th) {
  if (!A) return;
  switch (item.sound) {
    /* aquatic */
    case "deepboom": return A.deepboom.triggerAttackRelease("C1", "4n", time);
    case "deeptom":  return A.deeptom.triggerAttackRelease("E2", "4n", time);
    case "blub":     return A.blub.triggerAttackRelease("C5", "8n", time);
    case "wash":     return A.wash.triggerAttackRelease("4n", time);
    /* jungle */
    case "log":       return A.log.triggerAttackRelease("G1", "8n", time);
    case "djembe":    return A.djembe.triggerAttackRelease("A2", "8n", time);
    case "block":     return A.block.triggerAttackRelease("G4", "16n", time);
    case "shakerpod": return A.shakerpod.triggerAttackRelease("16n", time);
    /* space */
    case "boom8":  return A.boom8.triggerAttackRelease("C1", "8n", time);
    case "snare8": return A.snare8.triggerAttackRelease("16n", time);
    case "zap":    return A.zap.triggerAttackRelease("C6", "8n", time);
    case "tick8":  return A.tick8.triggerAttackRelease("32n", time);
    /* city */
    case "anvil":  return A.anvil.triggerAttackRelease("E3", "8n", time);
    case "barrel": return A.barrel.triggerAttackRelease("C2", "8n", time);
    case "lid":    return A.lid.triggerAttackRelease("A5", "16n", time);
    case "hiss":   return A.hiss.triggerAttackRelease("8n", time);
    default: break;
  }
  /* melodic: note length matches each world's character */
  const dur = th === "aqua" ? "4n" : th === "space" ? "16n" : "8n";
  if (item.kind === "note" || item.kind === "soft") {
    if (item.voice === "marimba") {
      /* humanize: every strike gets a slightly different force and micro-detune */
      const vel = 0.72 + Math.random() * 0.28;
      const f = Tone.Frequency(item.note).toFrequency() * (1 + (Math.random() - 0.5) * 0.004);
      A.mallet.triggerAttackRelease("32n", time, vel);        /* woody click */
      A.marimbaBody.triggerAttackRelease(f, "16n", time, vel * 0.8); /* resonator warmth */
      return A.marimba.triggerAttackRelease(f, dur, time, vel);      /* the bar itself */
    }
    return A[item.voice].triggerAttackRelease(item.note, dur, time);
  }
  if (item.kind === "chord") {
    /* arpeggio speed: dreamy underwater, medium jungle, rapid-fire chiptune */
    const dt = Tone.Time(th === "aqua" ? "16n" : th === "space" ? "64n" : "32n").toSeconds();
    item.notes.forEach((n, i) => A[item.voice].triggerAttackRelease(n, dur, time + i * dt));
  }
}
