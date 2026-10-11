import React, { useState, useRef, useEffect, useCallback } from "react";
import * as Tone from "tone";
import { createEngine, playItem } from "./audioEngine.js";
import {
  Sprite, CharSprite, WORLD_ICON, Icon, EraserIcon, TrashIcon,
  Shell, Starfish, Rock, Coral, Bubble, Urchin,
  Log, Drum, Coconut, SeedPod, Fruit, Flower,
  Asteroid, Satellite, Laser, Sparkle, Planet, StarIcon, Comet,
  Anvil, Barrel, Lid, Hydrant, Sign, Boombox, Cone,
} from "./pixel.jsx";

/* ============================================================
   RHYTHM RUNNERS — music sequencing for kids
   4 characters race across an invisible 16-step grid.
   Objects placed on their paths shake & play when reached.
   Everything stays in C-major pentatonic. Three worlds,
   three very different soundscapes:
     🌊 dark, muted, long underwater tones
     🌴 bright, dry, woody hits (marimba / kalimba)
     🪐 pure square-wave bips, 8-bit chiptune vibes
   ============================================================ */

const STEPS = 16;

const THEME_ORDER = ["aqua", "jungle", "space", "city"];

/* All characters, objects and icons are pixel-art sprites, see pixel.jsx */
const LEAF = ["...kk.", "..kglk", ".kgglk", "kgglk.", "kglk..", ".kk..."];
const COMET = [
  "..........tt",
  "........tttt",
  "......ttttt.",
  "..kkk.ttt...",
  ".kmlmkt.....",
  "kmllmmk.....",
  "kmlmmmk.....",
  ".kmmdk......",
  "..kkk.......",
];
/* deterministic pseudo-random number in [0, 1) for (i, n) */
const hash = (i, n) => {
  const v = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
/* a fixed, scattered starfield: most stars still, some twinkle, a few sparkle */
const STARS = Array.from({ length: 18 }, (_, i) => {
  const kind = i % 7 === 0 ? "big" : i % 3 === 0 ? "tw" : hash(i, 3) > 0.5 ? "dim" : "";
  return { x: 1 + hash(i, 1) * 97, y: 2 + hash(i, 2) * 86, kind,
    dur: (2.4 + hash(i, 4) * 2.4).toFixed(2), delay: (hash(i, 5) * 4).toFixed(2) };
});
/* city skyline: buildings and their windows come from the same data, so windows always sit inside a building */
const SKYLINE = (() => {
  const out = [];
  for (const back of [true, false]) {
    let x = back ? -3 : -1, i = back ? 0 : 100;
    while (x < 100) {
      const w = back ? 7 + hash(i, 1) * 6 : 6 + hash(i, 1) * 5;
      const h = back ? 45 + hash(i, 2) * 30 : 25 + hash(i, 2) * 30;
      const wins = back ? [] : Array.from({ length: 80 }, (_, j) => {
        const r = hash(i * 13 + j, 7);
        return r < 0.08 ? "flick" : r < 0.42 ? "on" : "";
      });
      out.push({ x, w, h, back, wins, id: i });
      x += w + (back ? hash(i, 3) * 2 : 2 + hash(i, 3) * 5);
      i++;
    }
  }
  return out;
})();
/* ---------- themes ----------
   percussion item: { id, label, icon, sound }
   melodic item:    { id, label, icon, kind:'note'|'soft'|'chord', voice, note|notes } */
export const THEMES = {
  aqua: {
    title: "Reef",
    icon: "🌊",
    sceneClass: "aqua",
    amb: "bubble",
    lanes: [
      { id: "crab",   emoji: "🦀", color: "#d9735f", flip: false },
      { id: "puffer", emoji: "🐡", color: "#e8c46a", flip: true  },
      { id: "fish",   emoji: "🐠", color: "#6fc0c8", flip: true  },
      { id: "turtle", emoji: "🐢", color: "#8ccf9e", flip: true  },
    ],
    items: {
      crab: [
        { id: "rock",  label: "Boom", icon: <Rock />,  sound: "deepboom" },
        { id: "coral", label: "Tom",  icon: <Coral />, sound: "deeptom" },
      ],
      puffer: [
        { id: "bubble", label: "Blub", icon: <Bubble />, sound: "blub" },
        { id: "urchin", label: "Shh",  icon: <Urchin />, sound: "wash" },
      ],
      fish: [
        { id: "sh-c", label: "Do",  icon: <Shell color="#d97a7a" />, kind: "note", voice: "deepPluck", note: "C4" },
        { id: "sh-d", label: "Re",  icon: <Shell color="#dda06a" />, kind: "note", voice: "deepPluck", note: "D4" },
        { id: "sh-e", label: "Mi",  icon: <Shell color="#d8c674" />, kind: "note", voice: "deepPluck", note: "E4" },
        { id: "sh-g", label: "Sol", icon: <Shell color="#86c29a" />, kind: "note", voice: "deepPluck", note: "G4" },
        { id: "sh-a", label: "La",  icon: <Shell color="#7aaed0" />, kind: "note", voice: "deepPluck", note: "A4" },
      ],
      turtle: [
        { id: "sh-c5", label: "Do",   icon: <Shell color="#d97a7a" />, kind: "soft", voice: "pad", note: "C5" },
        { id: "sh-g5", label: "Sol",  icon: <Shell color="#86c29a" />, kind: "soft", voice: "pad", note: "G4" },
        { id: "st-c",  label: "Do M", icon: <Starfish color="#d97a7a" />, kind: "chord", voice: "pad", notes: ["C3","G3","E4","C5"] },
        { id: "st-am", label: "La m", icon: <Starfish color="#7aaed0" />, kind: "chord", voice: "pad", notes: ["A2","E3","C4","A4"] },
        { id: "st-f",  label: "Fa M", icon: <Starfish color="#a98ac8" />, kind: "chord", voice: "pad", notes: ["F2","C3","A3","F4"] },
      ],
    },
    start: () => {
      const g = {};
      [0, 4, 8, 12].forEach((s) => (g[`crab-${s}`] = "rock"));
      [2, 6, 10, 14].forEach((s) => (g[`puffer-${s}`] = "bubble"));
      g["fish-0"] = "sh-c"; g["fish-3"] = "sh-e"; g["fish-6"] = "sh-g"; g["fish-10"] = "sh-a"; g["fish-12"] = "sh-g";
      g["turtle-0"] = "st-c"; g["turtle-8"] = "st-am";
      return g;
    },
    defaultSel: { lane: "fish", item: "sh-c" },
  },

  jungle: {
    title: "Jungle",
    icon: "🌴",
    sceneClass: "jungle",
    amb: "leaf",
    lanes: [
      { id: "gorilla", emoji: "🦍", color: "#c98a4b", flip: true },
      { id: "parrot",  emoji: "🦜", color: "#ff2a5d", flip: true },
      { id: "monkey",  emoji: "🐒", color: "#ffc400", flip: true },
      { id: "sloth",   emoji: "🦥", color: "#4fd1e0", flip: true },
    ],
    items: {
      gorilla: [
        { id: "log",  label: "Boom", icon: <Log />,  sound: "log" },
        { id: "drum", label: "Tum",  icon: <Drum />, sound: "djembe" },
      ],
      parrot: [
        { id: "coco", label: "Tock", icon: <Coconut />, sound: "block" },
        { id: "pod",  label: "Chh", icon: <SeedPod />, sound: "shakerpod" },
      ],
      monkey: [
        { id: "fr-c", label: "Do",  icon: <Fruit color="#ff3b30" />, kind: "note", voice: "marimba", note: "C4" },
        { id: "fr-d", label: "Re",  icon: <Fruit color="#ff8c00" />, kind: "note", voice: "marimba", note: "D4" },
        { id: "fr-e", label: "Mi",  icon: <Fruit color="#ffd400" />, kind: "note", voice: "marimba", note: "E4" },
        { id: "fr-g", label: "Sol", icon: <Fruit color="#4cd419" />, kind: "note", voice: "marimba", note: "G4" },
        { id: "fr-a", label: "La",  icon: <Fruit color="#1e90ff" />, kind: "note", voice: "marimba", note: "A4" },
      ],
      sloth: [
        { id: "ka-c", label: "Do",   icon: <Fruit color="#ff3b30" />, kind: "soft", voice: "kalimba", note: "C5" },
        { id: "ka-g", label: "Sol",  icon: <Fruit color="#4cd419" />, kind: "soft", voice: "kalimba", note: "G5" },
        { id: "fl-c",  label: "Do M", icon: <Flower color="#ff3b30" />, kind: "chord", voice: "kalimba", notes: ["C4","E4","G4","C5"] },
        { id: "fl-am", label: "La m", icon: <Flower color="#1e90ff" />, kind: "chord", voice: "kalimba", notes: ["A3","C4","E4","A4"] },
        { id: "fl-f",  label: "Fa M", icon: <Flower color="#a64dff" />, kind: "chord", voice: "kalimba", notes: ["F3","A3","C4","F4"] },
      ],
    },
    start: () => {
      const g = {};
      [0, 4, 8, 12].forEach((s) => (g[`gorilla-${s}`] = "log"));
      [2, 6, 10, 14].forEach((s) => (g[`parrot-${s}`] = "coco"));
      g["monkey-0"] = "fr-c"; g["monkey-2"] = "fr-e"; g["monkey-5"] = "fr-g"; g["monkey-8"] = "fr-a"; g["monkey-11"] = "fr-g"; g["monkey-14"] = "fr-e";
      g["sloth-0"] = "fl-c"; g["sloth-8"] = "fl-f";
      return g;
    },
    defaultSel: { lane: "monkey", item: "fr-c" },
  },

  space: {
    title: "Space",
    icon: "🪐",
    sceneClass: "space",
    amb: "star",
    lanes: [
      { id: "rocket", emoji: "🚀", color: "#ff2e88", flip: false },
      { id: "alien",  emoji: "👽", color: "#5dff6e", flip: false },
      { id: "ufo",    emoji: "🛸", color: "#29d9ff", flip: false },
      { id: "robot",  emoji: "🤖", color: "#fff05a", flip: false },
    ],
    items: {
      rocket: [
        { id: "ast", label: "Boom", icon: <Asteroid />,  sound: "boom8" },
        { id: "sat", label: "Ksh",  icon: <Satellite />, sound: "snare8" },
      ],
      alien: [
        { id: "laser", label: "Pew", icon: <Laser />,   sound: "zap" },
        { id: "spark", label: "Tick",  icon: <Sparkle />, sound: "tick8" },
      ],
      ufo: [
        { id: "pl-c", label: "Do",  icon: <Planet color="#ff3d6e" />, kind: "note", voice: "chip", note: "C5" },
        { id: "pl-d", label: "Re",  icon: <Planet color="#ff9a1f" />, kind: "note", voice: "chip", note: "D5" },
        { id: "pl-e", label: "Mi",  icon: <Planet color="#f7f240" />, kind: "note", voice: "chip", note: "E5" },
        { id: "pl-g", label: "Sol", icon: <Planet color="#45ff7a" />, kind: "note", voice: "chip", note: "G5" },
        { id: "pl-a", label: "La",  icon: <Planet color="#3dd2ff" />, kind: "note", voice: "chip", note: "A5" },
      ],
      robot: [
        { id: "st-c6", label: "Do",   icon: <StarIcon color="#ff3d6e" />, kind: "soft", voice: "pulse", note: "C6" },
        { id: "st-g5", label: "Sol",  icon: <StarIcon color="#45ff7a" />, kind: "soft", voice: "pulse", note: "G5" },
        { id: "cm-c",  label: "Do M", icon: <Comet color="#ff3d6e" />, kind: "chord", voice: "pulse", notes: ["C4","G4","E5","C6"] },
        { id: "cm-am", label: "La m", icon: <Comet color="#3dd2ff" />, kind: "chord", voice: "pulse", notes: ["A3","E4","C5","A5"] },
        { id: "cm-f",  label: "Fa M", icon: <Comet color="#c45cff" />, kind: "chord", voice: "pulse", notes: ["F3","C4","A4","F5"] },
      ],
    },
    start: () => {
      const g = {};
      g["rocket-0"] = "ast"; g["rocket-8"] = "ast"; g["rocket-4"] = "sat"; g["rocket-12"] = "sat";
      [2, 6, 10, 14].forEach((s) => (g[`alien-${s}`] = "spark"));
      g["alien-7"] = "laser";
      g["ufo-0"] = "pl-c"; g["ufo-2"] = "pl-e"; g["ufo-4"] = "pl-g"; g["ufo-6"] = "pl-e";
      g["ufo-8"] = "pl-a"; g["ufo-10"] = "pl-g"; g["ufo-12"] = "pl-e"; g["ufo-14"] = "pl-d";
      g["robot-0"] = "cm-c"; g["robot-8"] = "cm-am";
      return g;
    },
    defaultSel: { lane: "ufo", item: "pl-c" },
  },

  city: {
    title: "City",
    icon: "🏙️",
    sceneClass: "city",
    amb: "window",
    lanes: [
      { id: "worker",  emoji: "👷", color: "#f2a530", flip: true },
      { id: "runner",  emoji: "🏃", color: "#e0587a", flip: true },
      { id: "cyclist", emoji: "🚴", color: "#4fa3e0", flip: true },
      { id: "skater",  emoji: "🛹", color: "#a77be6", flip: false },
    ],
    items: {
      worker: [
        { id: "anvil",  label: "Clang", icon: <Anvil />,  sound: "anvil" },
        { id: "barrel", label: "Boom",  icon: <Barrel />, sound: "barrel" },
      ],
      runner: [
        { id: "lid",     label: "Chak", icon: <Lid />,     sound: "lid" },
        { id: "hydrant", label: "Pssh",  icon: <Hydrant />, sound: "hiss" },
      ],
      cyclist: [
        { id: "sg-c", label: "Do",  icon: <Sign color="#e0635a" />, kind: "note", voice: "bell", note: "C5" },
        { id: "sg-d", label: "Re",  icon: <Sign color="#e8954a" />, kind: "note", voice: "bell", note: "D5" },
        { id: "sg-e", label: "Mi",  icon: <Sign color="#e8c95a" />, kind: "note", voice: "bell", note: "E5" },
        { id: "sg-g", label: "Sol", icon: <Sign color="#6fb07a" />, kind: "note", voice: "bell", note: "G5" },
        { id: "sg-a", label: "La",  icon: <Sign color="#5a8fc8" />, kind: "note", voice: "bell", note: "A5" },
      ],
      skater: [
        { id: "cn-c", label: "Do",   icon: <Cone color="#e0635a" />, kind: "soft", voice: "keys", note: "C4" },
        { id: "cn-g", label: "Sol",  icon: <Cone color="#6fb07a" />, kind: "soft", voice: "keys", note: "G4" },
        { id: "bb-c",  label: "Do M", icon: <Boombox color="#e0635a" />, kind: "chord", voice: "keys", notes: ["C3","G3","E4","C5"] },
        { id: "bb-am", label: "La m", icon: <Boombox color="#5a8fc8" />, kind: "chord", voice: "keys", notes: ["A2","E3","C4","A4"] },
        { id: "bb-f",  label: "Fa M", icon: <Boombox color="#9a7ac0" />, kind: "chord", voice: "keys", notes: ["F2","C3","A3","F4"] },
      ],
    },
    start: () => {
      const g = {};
      g["worker-0"] = "barrel"; g["worker-8"] = "barrel"; g["worker-4"] = "anvil"; g["worker-12"] = "anvil";
      [2, 6, 10, 14].forEach((s) => (g[`runner-${s}`] = "lid"));
      g["runner-15"] = "hydrant";
      g["cyclist-0"] = "sg-c"; g["cyclist-3"] = "sg-e"; g["cyclist-6"] = "sg-g"; g["cyclist-10"] = "sg-a"; g["cyclist-13"] = "sg-g";
      g["skater-0"] = "bb-c"; g["skater-8"] = "bb-f"; g["skater-4"] = "cn-g"; g["skater-12"] = "cn-c";
      return g;
    },
    defaultSel: { lane: "cyclist", item: "sg-c" },
  },
};

/* ---------- moods (test) ----------
   Each mood is a 5-note scale. Every object keeps its slot (Do Re Mi Sol La),
   only the pitch changes, so melodies keep their shape and stay in tune.
   note: pitch-class changes for single notes; chords: what each chord becomes. */
const MOODS = {
  happy: { name: "Happy", scale: "Major", icon: "happy", bg: "#ffd166", fg: "#5a3a00", tint: null,
    note: {}, label: {}, chords: {} },
  wistful: { name: "Wistful", scale: "Kumoi", icon: "meh", bg: "#9fc7e8", fg: "#1d3550", tint: "rgba(40,60,110,.12)",
    note: { E: "Eb" }, label: { Mi: "Mi♭" },
    chords: { "Do M": ["Do m", { E: "Eb" }], "La m": ["Re m", { C: "D", E: "F" }], "Fa M": ["Fa M", {}] } },
  sad: { name: "Sad", scale: "Hirajoshi", icon: "sad", bg: "#5b63c9", fg: "#eef0ff", tint: "rgba(24,16,72,.24)",
    note: { E: "Eb", A: "Ab" }, label: { Mi: "Mi♭", La: "La♭" },
    chords: { "Do M": ["Do m", { E: "Eb" }], "La m": ["La♭ M", { A: "Ab", E: "Eb" }], "Fa M": ["Fa m", { A: "Ab" }] } },
  adventure: { name: "Adventure", scale: "Suspended", icon: "peak", bg: "#7fcf8a", fg: "#123a1a", tint: "rgba(255,190,90,.08)",
    note: { E: "F", A: "Bb" }, label: { Mi: "Fa", La: "Si♭" },
    chords: { "Do M": ["Do sus4", { E: "F" }], "La m": ["Si♭ M", { A: "Bb", C: "D", E: "F" }], "Fa M": ["Fa sus2", { A: "G" }] } },
  dreamy: { name: "Dreamy", scale: "Whole tone", icon: "spark", bg: "#d6a7ff", fg: "#3a1660", tint: "rgba(150,90,220,.16)",
    note: { G: "F#", A: "G#" }, label: { Sol: "Fa♯", La: "Sol♯" },
    chords: { "Do M": ["Do+", { G: "G#" }], "La m": ["Re+", { A: "A#", C: "D", E: "F#" }], "Fa M": ["Mi+", { F: "E", A: "G#" }] } },
  mysterious: { name: "Mysterious", scale: "In", icon: "moon", bg: "#3f3a66", fg: "#e6e2ff", tint: "rgba(10,6,40,.34)",
    note: { D: "Db", E: "F", A: "Ab" }, label: { Re: "Re♭", Mi: "Fa", La: "La♭" },
    chords: { "Do M": ["Do sus4", { E: "F" }], "La m": ["Re♭ M", { A: "Ab", C: "Db", E: "F" }], "Fa M": ["Fa m", { A: "Ab" }] } },
};
const MOOD_ORDER = ["happy", "wistful", "sad", "adventure", "dreamy", "mysterious"];

const shiftNote = (n, map) => {
  const [, pc, oct] = n.match(/^([A-G][#b]?)(\d)$/);
  return (map[pc] ?? pc) + oct;
};
const toMood = (item, m) => {
  if (item.kind === "chord") {
    const [label, map] = m.chords[item.label] ?? [item.label, {}];
    return { ...item, label, notes: item.notes.map((n) => shiftNote(n, map)) };
  }
  if (item.note) return { ...item, label: m.label[item.label] ?? item.label, note: shiftNote(item.note, m.note) };
  return item; // percussion is the same in every mood
};
const moodCache = new Map();
const inMood = (item, mood) => {
  if (mood === "happy") return item;
  const key = mood + "|" + item.id;
  if (!moodCache.has(key)) moodCache.set(key, toMood(item, MOODS[mood]));
  return moodCache.get(key);
};

const findItem = (themeId, laneId, itemId) =>
  THEMES[themeId].items[laneId]?.find((i) => i.id === itemId);

export default function RhythmRunners() {
  const [theme, setTheme] = useState("aqua");
  const [grids, setGrids] = useState(() => ({
    aqua: THEMES.aqua.start(),
    jungle: THEMES.jungle.start(),
    space: THEMES.space.start(),
    city: THEMES.city.start(),
  }));
  const [selected, setSelected] = useState(THEMES.aqua.defaultSel);
  const [eraser, setEraser] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [tempo, setTempo] = useState(104);
  const [mood, setMood] = useState("happy");
  const [moodOpen, setMoodOpen] = useState(false);
  const moodRef = useRef(mood);
  moodRef.current = mood;
  const holdTimer = useRef(null);
  const heldOpen = useRef(false);
  const [step, setStep] = useState(-1);
  const [shakes, setShakes] = useState({});

  const T = THEMES[theme];
  const grid = grids[theme];

  const gridRef = useRef(grid);
  gridRef.current = grid;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const audio = useRef(null);
  const fishRefs = useRef({});
  const rafRef = useRef(null);

  const buildAudio = useCallback(async () => {
    if (audio.current) return audio.current;
    await Tone.start();
    const A = await createEngine();

    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = "1m";
    Tone.Transport.bpm.value = tempo;

    Tone.Transport.scheduleRepeat((time) => {
      const s = Math.round(Tone.Transport.getTicksAtTime(time) / (Tone.Transport.PPQ / 4)) % STEPS;
      const th = themeRef.current;
      const g = gridRef.current;
      const hits = [];
      THEMES[th].lanes.forEach((lane) => {
        const itemId = g[`${lane.id}-${s}`];
        if (!itemId) return;
        const item = findItem(th, lane.id, itemId);
        if (!item) return;
        hits.push(`${lane.id}-${s}`);
        playItem(audio.current, inMood(item, moodRef.current), time, th);
      });
      Tone.Draw.schedule(() => {
        setStep(s);
        if (hits.length)
          setShakes((prev) => {
            const nx = { ...prev };
            hits.forEach((k) => (nx[k] = (nx[k] || 0) + 1));
            return nx;
          });
      }, time);
    }, "16n");

    audio.current = A;
    return A;
  }, [tempo]);



  const preview = async (item) => {
    const A = await buildAudio();
    playItem(A, inMood(item, moodRef.current), Tone.now(), themeRef.current);
  };

  const togglePlay = async () => {
    await buildAudio();
    if (playing) {
      Tone.Transport.pause();
      setPlaying(false);
    } else {
      Tone.Transport.start("+0.05");
      setPlaying(true);
    }
  };

  const switchTheme = (next) => {
    setTheme(next);
    setSelected(THEMES[next].defaultSel);
    setEraser(false);
    setShakes({});
  };

  useEffect(() => {
    if (audio.current) Tone.Transport.bpm.rampTo(tempo, 0.2);
  }, [tempo]);

  /* ---------- characters follow the transport ---------- */
  useEffect(() => {
    const loop = () => {
      const p = playing ? Tone.Transport.progress : 0;
      const x = ((p * STEPS + 0.5) % STEPS) / STEPS;
      THEMES[themeRef.current].lanes.forEach((lane) => {
        const el = fishRefs.current[lane.id];
        if (el) el.style.left = `${x * 100}%`;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, theme]);

  /* ---------- grid interaction ---------- */
  const tapCell = (laneId, s) => {
    const key = `${laneId}-${s}`;
    setGrids((all) => {
      const g = { ...all[theme] };
      if (eraser) {
        delete g[key];
      } else if (selected.lane !== laneId) {
        if (g[key]) delete g[key]; // tapping an object in another lane removes it
      } else if (g[key] === selected.item) {
        delete g[key];
      } else {
        g[key] = selected.item;
        const item = findItem(theme, laneId, selected.item);
        if (item) preview(item);
      }
      return { ...all, [theme]: g };
    });
  };

  const clearAll = () => setGrids((all) => ({ ...all, [theme]: {} }));

  /* Mood button: a tap switches Happy <-> Sad; pressing and holding it for about a
     second opens the full mood picker (a hidden extra for grown-ups). */
  const moodDown = () => {
    heldOpen.current = false;
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => { heldOpen.current = true; setMoodOpen(true); }, 900);
  };
  const moodCancel = () => clearTimeout(holdTimer.current);
  const moodTap = () => {
    clearTimeout(holdTimer.current);
    if (heldOpen.current) { heldOpen.current = false; return; } // the hold already opened the picker
    if (moodOpen) { setMoodOpen(false); return; }
    pickMood(mood === "happy" ? "sad" : "happy");
  };

  /* picking a mood plays the world's first chord so the change is heard right away */
  const pickMood = (next) => {
    moodRef.current = next;
    setMood(next);
    setMoodOpen(false);
    const chordLane = THEMES[theme].lanes[3].id;
    const chord = THEMES[theme].items[chordLane].find((i) => i.kind === "chord");
    if (chord) preview(chord);
  };

  /* ---------- fullscreen (not available on iPhone Safari: use Add to Home Screen there) ---------- */
  const canFullscreen = typeof document !== "undefined" &&
    !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const [isFull, setIsFull] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFull(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        const el = document.documentElement;
        await (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        try { await screen.orientation?.lock?.("landscape"); } catch (e) { /* not supported everywhere */ }
      }
    } catch (e) { /* ignore: user gesture or browser refused */ }
  };

  /* ---------- render ---------- */
  return (
    <div className={`rr-root ${T.sceneClass}`}>
      <style>{css}</style>

      <header className="rr-header">
        <h1><span className="rr-h1-icon"><CharSprite id={WORLD_ICON[theme]} /></span>Rhythm Runners <span className="rr-sub">{T.title}</span></h1>
        <div className="rr-controls">
          <div className="rr-theme">
            {THEME_ORDER.map((id) => (
              <button key={id} className={theme === id ? "cur" : ""} onClick={() => switchTheme(id)} title={THEMES[id].title}>
                <CharSprite id={WORLD_ICON[id]} />
              </button>
            ))}
          </div>
          <button className={`rr-play ${playing ? "on" : ""}`} onClick={togglePlay}>
            <span className="rr-play-ic"><Icon name={playing ? "pause" : "play"} /></span>
          </button>
          <div className="rr-tempo">
            {[{ t: 80, e: "speed1" }, { t: 104, e: "speed2" }, { t: 132, e: "speed3" }].map((o) => (
              <button key={o.t} className={tempo === o.t ? "sel" : ""} onClick={() => setTempo(o.t)} title={`${o.t} bpm`}>
                <span className="rr-ic"><Icon name={o.e} /></span>
              </button>
            ))}
          </div>
          <div className="rr-mood-wrap">
            <button className="rr-tool rr-mood" onClick={moodTap}
              onPointerDown={moodDown} onPointerUp={moodCancel} onPointerLeave={moodCancel} onPointerCancel={moodCancel}
              onContextMenu={(e) => e.preventDefault()}
              style={{ background: MOODS[mood].bg, color: MOODS[mood].fg }}
              title={`Mood: ${MOODS[mood].name}`} aria-label={`Mood: ${MOODS[mood].name}`} aria-expanded={moodOpen}>
              <span className="rr-ic"><Icon name={MOODS[mood].icon} /></span>
            </button>
            {moodOpen && <div className="rr-moods-backdrop" onClick={() => setMoodOpen(false)} />}
            {moodOpen && (
              <div className="rr-moods" role="menu">
                {MOOD_ORDER.map((id) => (
                  <button key={id} role="menuitem" className={`rr-mood-opt ${mood === id ? "cur" : ""}`} onClick={() => pickMood(id)}>
                    <span className="rr-mood-ic" style={{ background: MOODS[id].bg, color: MOODS[id].fg }}>
                      <span className="rr-ic"><Icon name={MOODS[id].icon} /></span>
                    </span>
                    <span className="rr-mood-txt"><b>{MOODS[id].name}</b><small>{MOODS[id].scale}</small></span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className={`rr-tool ${eraser ? "sel" : ""}`} onClick={() => setEraser(!eraser)} title="Eraser">
            <span className="rr-ic"><EraserIcon /></span>
          </button>
          <button className="rr-tool" onClick={clearAll} title="Clear all"><span className="rr-ic"><TrashIcon /></span></button>
          {canFullscreen && (
            <button className="rr-tool rr-full" onClick={toggleFullscreen} title={isFull ? "Exit full screen" : "Full screen"}>
              <span className="rr-ic"><Icon name={isFull ? "unfull" : "full"} /></span>
            </button>
          )}
        </div>
      </header>

      <div className={`rr-scene ${T.sceneClass}`} style={{ "--mood-tint": MOODS[mood].tint || "transparent" }}>
        <div className="rr-rays" />
        {T.amb === "bubble" &&
          [...Array(9)].map((_, i) => (
            <span key={`b${i}`} className="rr-amb" style={{ left: `${(i * 11 + 4) % 100}%`, animationDelay: `${i * 1.7}s`, animationDuration: `${7 + (i % 4) * 2}s` }} />
          ))}
        {T.amb === "leaf" &&
          [...Array(9)].map((_, i) => (
            <span key={`l${i}`} className="rr-leaf" style={{ left: `${(i * 13 + 3) % 100}%`, animationDelay: `${i * 2.1}s`, animationDuration: `${9 + (i % 4) * 2.5}s` }}><Sprite grid={LEAF} pal={{ g: "#7bd15c", l: "#c4f08a" }} canvas={6} /></span>
          ))}
        {T.amb === "star" && (
          <>
            {STARS.map((st, i) => (
              <span key={`s${i}`} className={`rr-star ${st.kind}`} style={{
                left: `${st.x}%`, top: `${st.y}%`,
                "--d": `${st.dur}s`, animationDelay: `${st.delay}s`,
              }} />
            ))}
            <span className="rr-comet"><Sprite grid={COMET} pal={{ m: "#ffffff", l: "#ffffff", d: "#bfefff", t: "#7fe9ff", k: "#29d9ff" }} /></span>
          </>
        )}

        {T.amb === "window" && (
          <div className="rr-city">
            {SKYLINE.map((b) => (
              <div key={b.id} className={`rr-bldg ${b.back ? "back" : ""}`}
                style={{ left: `${b.x}%`, width: `${b.w}%`, height: `${b.h}%` }}>
                {b.wins.map((st, j) => (
                  <span key={j} className={`rr-win ${st}`}
                    style={st === "flick" ? { animationDelay: `${((b.id * 7 + j) % 11) * 0.9}s` } : undefined} />
                ))}
              </div>
            ))}
          </div>
        )}

        {T.lanes.map((lane, li) => (
          <div key={lane.id} className={`rr-lane ${selected.lane === lane.id && !eraser ? "hot" : ""}`}>
            <div className="rr-lane-tint" style={{ background: lane.color }} />
            {Array.from({ length: STEPS }).map((_, s) => {
              const key = `${lane.id}-${s}`;
              const itemId = grid[key];
              const item = itemId ? findItem(theme, lane.id, itemId) : null;
              return (
                <button key={s} className={`rr-cell ${s === step ? "now" : ""} ${s % 4 === 0 ? "beat" : ""}`} onPointerDown={() => tapCell(lane.id, s)}>
                  {item && (
                    <span key={shakes[key] || 0} className={`rr-obj ${shakes[key] ? "shake" : ""}`}>
                      {item.icon}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="rr-swimmer" ref={(el) => (fishRefs.current[lane.id] = el)}>
              <span className={`rr-fish ${playing ? "swim" : ""}`} style={{ animationDelay: `${li * 0.15}s` }}>
                <CharSprite id={lane.id} />
              </span>
            </div>
          </div>
        ))}
        <div className={`rr-ground ${T.sceneClass}`} />
      </div>

      <footer className="rr-palette">
        {T.lanes.map((lane) => (
          <div key={lane.id} className="rr-group" style={{ "--lc": lane.color }}>
            <span className="rr-group-tag"><CharSprite id={lane.id} /></span>
            {T.items[lane.id].map((item) => {
              const isSel = !eraser && selected.lane === lane.id && selected.item === item.id;
              return (
                <button
                  key={item.id}
                  className={`rr-pal ${isSel ? "sel" : ""}`}
                  onClick={() => {
                    setEraser(false);
                    setSelected({ lane: lane.id, item: item.id });
                    preview(item);
                  }}
                >
                  <span className="rr-pal-ic">{item.icon}</span>
                  <span className="rr-pal-lb">{inMood(item, mood).label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </footer>
    </div>
  );
}

/* ============================ styles ============================ */
const css = `
/* ================= PIXEL ART THEME ================= */
@font-face{font-family:'Pixelify Sans';font-weight:400;font-display:swap;src:url('fonts/pixelify-sans-latin-400-normal.woff2') format('woff2');}
@font-face{font-family:'Pixelify Sans';font-weight:700;font-display:swap;src:url('fonts/pixelify-sans-latin-700-normal.woff2') format('woff2');}

.rr-root{
  --ink:#1b1d2e;
  font-family:'Pixelify Sans',monospace;
  height:100vh; height:100dvh; display:flex; flex-direction:column;
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  box-sizing:border-box;
  color:#eaf6ff; user-select:none; -webkit-user-select:none; overflow:hidden;
}
/* each world: its own outline ink, frame colour and tone */
.rr-root.aqua{--ink:#0d2a3a;background:#0e2633;}
.rr-root.jungle{--ink:#1d2b10;background:#13260f;}
.rr-root.space{--ink:#0c0820;background:#05020f;}
.rr-root.city{--ink:#2b1e2a;background:#1d1828;}
.rr-root button{font-family:inherit;}

/* ---------- header ---------- */
.rr-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;gap:10px;flex-wrap:wrap;}
.rr-header h1{margin:0;font-size:clamp(18px,2.8vw,28px);font-weight:700;letter-spacing:1px;
  text-shadow:3px 3px 0 var(--ink);display:flex;align-items:center;gap:10px;}
.rr-h1-icon{width:30px;height:30px;display:block;filter:drop-shadow(2px 2px 0 var(--ink));}
.rr-sub{font-weight:400;opacity:.75;font-size:.7em;text-shadow:2px 2px 0 var(--ink);}
.rr-controls{display:flex;align-items:center;gap:8px;}
.rr-ic{width:20px;height:20px;display:block;}

/* chunky square buttons with hard pixel shadows */
.rr-theme,.rr-tempo{
  display:flex;gap:3px;padding:3px;background:rgba(0,0,0,.28);
  border:3px solid var(--ink);box-shadow:0 3px 0 var(--ink);
}
.rr-theme button,.rr-tempo button{
  width:38px;height:38px;display:grid;place-items:center;border:none;cursor:pointer;
  background:transparent;opacity:.5;padding:6px;color:#eaf6ff;
}
.rr-theme button.cur,.rr-tempo button.sel{opacity:1;background:rgba(255,255,255,.22);box-shadow:inset 0 -3px 0 rgba(0,0,0,.25);}
.rr-play{
  width:52px;height:52px;border:3px solid var(--ink);cursor:pointer;display:grid;place-items:center;
  background:#ffb020;color:#3a2200;box-shadow:inset -4px -4px 0 #d9851a,inset 4px 4px 0 #ffd76b,0 4px 0 var(--ink);
}
.rr-play:active{transform:translateY(3px);box-shadow:inset -4px -4px 0 #d9851a,inset 4px 4px 0 #ffd76b,0 1px 0 var(--ink);}
.rr-play.on{background:#4fc46b;color:#0b3a1a;box-shadow:inset -4px -4px 0 #2f9a4a,inset 4px 4px 0 #8fe8a2,0 4px 0 var(--ink);}
.rr-play-ic{width:22px;height:22px;display:block;}
.rr-tool{
  width:44px;height:44px;border:3px solid var(--ink);cursor:pointer;display:grid;place-items:center;
  background:#3a4570;color:#eaf6ff;box-shadow:inset -3px -3px 0 #28304f,inset 3px 3px 0 #5a68a0,0 3px 0 var(--ink);
}
.rr-tool:active{transform:translateY(2px);}
/* mood picker: the button wears the current mood's colour; the scene takes a light tint */
.rr-mood-wrap{position:relative;}
.rr-tool.rr-mood{-webkit-touch-callout:none;touch-action:manipulation;}
.rr-moods-backdrop{position:fixed;inset:0;z-index:19;}
.rr-tool.rr-mood{box-shadow:inset -3px -3px 0 rgba(0,0,0,.22),inset 3px 3px 0 rgba(255,255,255,.35),0 3px 0 var(--ink);}
.rr-moods{
  position:absolute;right:0;top:calc(100% + 8px);z-index:20;display:flex;flex-direction:column;gap:3px;
  padding:4px;min-width:178px;background:#20233a;border:3px solid var(--ink);box-shadow:0 4px 0 var(--ink);
}
.rr-mood-opt{display:flex;align-items:center;gap:8px;padding:4px 6px;border:none;background:transparent;color:#eaf6ff;cursor:pointer;text-align:left;}
.rr-mood-opt:hover,.rr-mood-opt.cur{background:rgba(255,255,255,.14);}
.rr-mood-ic{width:28px;height:28px;display:grid;place-items:center;flex-shrink:0;}
.rr-mood-ic .rr-ic{width:18px;height:18px;}
.rr-mood-txt{display:flex;flex-direction:column;line-height:1.1;}
.rr-mood-txt b{font-size:14px;}
.rr-mood-txt small{font-size:11px;opacity:.65;}
.rr-scene::before{content:"";position:absolute;inset:0;background:var(--mood-tint,transparent);pointer-events:none;transition:background .4s steps(4,end);}
.rr-tool.sel{background:#ffd166;box-shadow:inset -3px -3px 0 #d9a53a,inset 3px 3px 0 #ffe9a8,0 3px 0 var(--ink);}

/* ---------- scene: banded skies (hard colour steps, no smooth gradients) ---------- */
.rr-scene{
  flex:1;min-height:0;position:relative;margin:0 10px;overflow:hidden;
  border:3px solid var(--ink);box-shadow:0 4px 0 var(--ink);
  display:flex;flex-direction:column;
}
/* reef: muted teal, low saturation, darkening with depth */
.rr-scene.aqua{background:linear-gradient(180deg,#5aa6b5 0 16%,#4b94a6 16% 32%,#3e8296 32% 48%,#337085 48% 64%,#295e73 64% 80%,#1f4c60 80%);}
/* jungle: vivid lime to deep leaf green */
.rr-scene.jungle{background:linear-gradient(180deg,#c6ef5a 0 16%,#9fdf45 16% 32%,#77c937 32% 48%,#52ae2e 48% 64%,#389228 64% 80%,#237420 80%);}
/* space: near-black indigo */
.rr-scene.space{background:linear-gradient(180deg,#2a1a5e 0 16%,#22164f 16% 32%,#1b1141 32% 48%,#140c33 48% 64%,#0e0826 64% 80%,#08041a 80%);}
/* city: dusty sunset into smoggy night */
.rr-scene.city{background:linear-gradient(180deg,#e9a07c 0 16%,#d38a80 16% 32%,#b47786 32% 48%,#8f6888 48% 64%,#6a5880 64% 80%,#454569 80%);}
.rr-rays{display:none;}

/* ambience: everything snaps to whole pixels */
.rr-amb{
  position:absolute;bottom:-14px;width:6px;height:6px;
  background:rgba(200,232,240,.45);box-shadow:0 0 0 2px rgba(220,240,245,.4);
  animation:rise linear infinite;pointer-events:none;
}
@keyframes rise{from{transform:translateY(0)}to{transform:translateY(-110vh)}}
.rr-leaf{position:absolute;top:-30px;width:18px;height:18px;pointer-events:none;animation:fall linear infinite;}
@keyframes fall{
  0%{transform:translate(0,0) rotate(0)}
  25%{transform:translate(18px,27vh) rotate(90deg)}
  50%{transform:translate(0,54vh) rotate(180deg)}
  75%{transform:translate(-18px,81vh) rotate(270deg)}
  100%{transform:translate(0,110vh) rotate(360deg)}
}
.rr-star{position:absolute;width:3px;height:3px;background:#fff;pointer-events:none;opacity:.55;}
.rr-star.dim{opacity:.3;}
.rr-star.tw{animation:twinkle var(--d,3s) steps(1,end) infinite;}
.rr-star.big{box-shadow:3px 0 #fff,-3px 0 #fff,0 3px #fff,0 -3px #fff;animation:sparkle var(--d,3s) steps(1,end) infinite;}
@keyframes sparkle{0%,100%{opacity:.4;transform:scale(.67)}50%{opacity:1;transform:none}}
.rr-comet{position:absolute;width:28px;height:28px;pointer-events:none;z-index:0;
  animation:comet 25s steps(500,end) 6s infinite;opacity:0;}
@keyframes comet{
  0%{left:92%;top:-10%;opacity:.3}
  13%{left:-10%;top:96%;opacity:.3}
  13.01%,100%{left:-10%;top:96%;opacity:0}
}
@keyframes twinkle{0%,100%{opacity:.35}50%{opacity:1}}
.rr-city{position:absolute;inset:0;pointer-events:none;}
.rr-bldg{
  position:absolute;bottom:0;box-sizing:border-box;overflow:hidden;
  background:rgba(31,26,51,.55);padding:8px 5px;
  display:grid;grid-template-columns:repeat(auto-fill,6px);grid-auto-rows:6px;gap:6px;
  justify-content:center;align-content:start;
}
.rr-bldg.back{background:rgba(44,36,72,.42);}
.rr-win{width:6px;height:6px;}
.rr-win.on{background:rgba(255,204,102,.8);}
.rr-win.flick{background:rgba(255,204,102,.8);animation:flick 7s steps(1,end) infinite;}
@keyframes flick{0%,65%{opacity:1}65.01%,100%{opacity:0}}

.rr-ground{position:absolute;left:0;right:0;bottom:0;height:12px;pointer-events:none;}
.rr-ground.aqua{background:linear-gradient(180deg,#a8956a 0 4px,#cdbb8a 4px);}
.rr-ground.jungle{background:linear-gradient(180deg,#5a3a1c 0 4px,#7a5226 4px);}
.rr-ground.space{background:linear-gradient(180deg,#3a3555 0 4px,#5a5578 4px);}
.rr-ground.city{
  background:
    repeating-linear-gradient(90deg,transparent 0 24px,#f2c230 24px 42px,transparent 42px 66px) 0 6px/100% 3px no-repeat,
    linear-gradient(180deg,#2e2c36 0 4px,#45434f 4px);
}

/* ---------- lanes & cells ---------- */
.rr-lane{flex:1;position:relative;display:flex;border-bottom:3px dashed rgba(255,255,255,.16);}
.rr-lane:last-child{border-bottom:none;}
.rr-lane-tint{position:absolute;inset:0;opacity:0;pointer-events:none;}
.rr-lane.hot .rr-lane-tint{opacity:.12;}
.rr-cell{flex:1;border:none;background:transparent;cursor:pointer;position:relative;padding:0;}
.rr-cell.beat{border-left:3px solid rgba(255,255,255,.08);}
.rr-cell.now{background:rgba(255,255,255,.12);}
.rr-obj{
  position:absolute;left:50%;top:50%;translate:-50% -50%;
  width:clamp(24px,84%,46px);aspect-ratio:1;max-height:86%;display:block;pointer-events:none;
  filter:drop-shadow(2px 2px 0 rgba(0,0,0,.35));
}
.rr-obj.shake{animation:wob .36s steps(1,end);}
@keyframes wob{
  0%{transform:none}
  20%{transform:translate(-2px,-4px) scale(1.25)}
  45%{transform:translate(2px,-2px) scale(1.15)}
  70%{transform:translate(-1px,0) scale(1.06)}
  100%{transform:none}
}

/* ---------- characters ---------- */
.rr-swimmer{position:absolute;top:50%;left:0;width:0;height:0;pointer-events:none;z-index:3;}
.rr-fish{
  --cs:clamp(34px,13vh,64px);
  position:absolute;left:0;top:0;width:var(--cs);height:var(--cs);display:block;
  margin-left:calc(var(--cs) * -0.75);margin-top:calc(var(--cs) * -0.5);
  filter:drop-shadow(2px 2px 0 rgba(0,0,0,.4));
}
.rr-fish.swim{animation:bob .44s steps(1,end) infinite;}
@keyframes bob{0%{transform:translateY(-2px)}50%{transform:translateY(2px)}}

/* ---------- palette ---------- */
.rr-palette{display:flex;gap:8px;padding:10px 10px 10px;overflow-x:auto;align-items:stretch;}
.rr-group{
  display:flex;align-items:center;gap:5px;padding:5px 8px;flex-shrink:0;
  background:rgba(0,0,0,.25);border:3px solid var(--lc);box-shadow:0 3px 0 var(--ink);
}
.rr-group-tag{width:26px;height:26px;display:block;margin-right:2px;}
.rr-pal{
  border:2px solid rgba(255,255,255,.18);cursor:pointer;padding:4px 6px 2px;min-width:50px;
  background:rgba(255,255,255,.08);display:flex;flex-direction:column;align-items:center;gap:2px;
}
.rr-pal:hover{background:rgba(255,255,255,.18);}
.rr-pal.sel{background:var(--lc);border-color:#fff;transform:translateY(-3px);box-shadow:0 3px 0 var(--ink);}
.rr-pal.sel .rr-pal-lb{color:var(--ink);font-weight:700;}
.rr-pal-ic{width:30px;height:30px;display:block;}
.rr-pal-lb{font-size:12px;color:#dff2ff;}
.rr-full{color:#eaf6ff;}

/* ---------- short screens: phones in landscape ---------- */
@media (max-height:520px){
  .rr-header{padding:4px 10px;gap:6px;flex-wrap:nowrap;}
  .rr-header h1{font-size:17px;white-space:nowrap;gap:6px;}
  .rr-h1-icon{width:22px;height:22px;}
  .rr-sub{display:none;}
  .rr-controls{gap:5px;}
  .rr-play{width:38px;height:38px;}
  .rr-play-ic{width:16px;height:16px;}
  .rr-theme button,.rr-tempo button{width:30px;height:30px;padding:5px;}
  .rr-tool{width:34px;height:34px;}
  .rr-ic{width:16px;height:16px;}
  .rr-scene{margin:0 6px;}
  .rr-palette{padding:6px 6px 6px;gap:6px;}
  .rr-group{padding:3px 5px;gap:3px;}
  .rr-group-tag{width:20px;height:20px;}
  .rr-pal{min-width:40px;padding:3px 4px 1px;}
  .rr-pal-ic{width:22px;height:22px;}
  .rr-pal-lb{font-size:10px;}
}
/* ---------- narrow screens: phones in portrait ---------- */
@media (max-width:600px){
  .rr-header{justify-content:center;}
  .rr-header h1{width:100%;justify-content:center;}
  .rr-controls{flex-wrap:wrap;justify-content:center;}
  .rr-fish{--cs:36px;}
}
`;
