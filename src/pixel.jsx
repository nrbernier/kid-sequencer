import React from "react";

/* ============================================================
   PIXEL ART — every character, object and icon is a tiny grid.
   One letter = one pixel; "." is transparent. Each sprite has
   its own palette. All sprites sit on a shared 12×12 canvas so
   pixels are the same size everywhere on screen.
   Recolorable sprites use m (main), d (dark), l (light).
   ============================================================ */

const INK = "#1b1d2e"; // outline colour, shared by everything

/* lighten (amt > 0) or darken (amt < 0) a hex colour */
const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
  return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("");
};
const tones = (c) => ({ m: c, d: shade(c, -0.32), l: shade(c, 0.5) });

export function Sprite({ grid, pal, canvas = 12 }) {
  const h = grid.length;
  const w = Math.max(...grid.map((r) => r.length));
  const S = Math.max(canvas, w, h);
  const ox = Math.floor((S - w) / 2);
  const oy = Math.floor((S - h) / 2);
  const rects = [];
  grid.forEach((row, y) => {
    // merge horizontal runs of the same colour into one rect
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === c) run++;
      // outlines follow the world's own ink colour (CSS --ink), unless a sprite sets its own
      const ink = c === "k" && !pal.k;
      const fill = ink ? INK : pal[c];
      if (c !== "." && fill)
        rects.push(<rect key={`${x}-${y}`} x={x + ox} y={y + oy} width={run + 0.04} height={1.04}
          fill={fill} style={ink ? { fill: "var(--ink, " + INK + ")" } : undefined} />);
      x += run;
    }
  });
  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" height="100%" shapeRendering="crispEdges" style={{ display: "block" }}>
      {rects}
    </svg>
  );
}

/* ======================= grids ======================= */
export const G = {
  /* ---------- reef ---------- */
  crab: [
    "kk.kk......kk.kk",
    "krkrk......krkrk",
    "krrrk......krrrk",
    ".krk........krk.",
    ".krk.kk..kk.krk.",
    "..krkwk..kwkrk..",
    "...kkkkkkkkkk...",
    "..krrrrrrrrrrk..",
    ".krrlrrrrrrlrrk.",
    "krrrrrrrrrrrrrrk",
    "krrrrrrkkrrrrrrk",
    ".krrrrrrrrrrrrk.",
    "..kkkkkkkkkkkk..",
    ".kk.k.k..k.k.kk.",
    "k..k.k....k.k..k",
  ],
  puffer: [
    "......k..k......",
    "...k..k..k..k...",
    "....kkkkkkkk....",
    "...kyyyyyyyyk...",
    "k.kyyyyyyyywwyk.",
    "kokyyyyyyyywkyyk",
    "kokyyyyyyyyyyyok",
    "k.kydyyyyyyyyyk.",
    "...kddyyyyyyyk..",
    "....kddddyyyk...",
    "..k..kkkkkkk.k..",
    "......k...k.....",
  ],
  fish: [
    "......kkkkkk....",
    "....kowwowwoook.",
    "kk.koowwowwowkok",
    "kokooowwowwooook",
    "kwkooowwowwoooak",
    "kokooowwowwooook",
    "kk.koowwowwook..",
    "....kkkkkkkkk...",
    "......kok.......",
  ],
  turtle: [
    "....kkkkkk......",
    "..kkgGggGgkk....",
    ".kgGggGGggGgk.kk",
    "kgGgGggGggGgksek",
    "kGgggGgggGggkssk",
    "kkkkkkkkkkkkksk.",
    ".kssk....ksssk..",
    ".kkk.....kkkkk..",
  ],
  rock: [
    "...kkkkk....",
    "..kllrrrkk..",
    ".klrrrrrrrk.",
    "krrrrrrdrrrk",
    "krrdrrrrrrdk",
    "kdrrrrrrrddk",
    ".kddddddddk.",
    "..kkkkkkkk..",
  ],
  coral: [
    ".k...k...k.",
    "kck.kck.kck",
    "kck.kck.kck",
    "kcckkck.kck",
    ".kcccckkcck",
    "..kkcccccck",
    "....kcckkk.",
    "....kcck...",
    "....kcck...",
    "...kkcckk..",
  ],
  bubble: [
    "...kkkk...",
    ".kkbbbbkk.",
    ".kwwbbbbk.",
    "kwwbbbbbbk",
    "kwbbbbbbbk",
    "kbbbbbbbbk",
    "kbbbbbbbdk",
    ".kbbbbbdk.",
    ".kkbbddkk.",
    "...kkkk...",
  ],
  urchin: [
    "k....k....k",
    ".k...k...k.",
    "..kkpppkk..",
    "..kpllpppk.",
    "kkpllppppkk",
    "..kpppppdk.",
    "..kkpppdkk.",
    ".k...k...k.",
    "k....k....k",
  ],
  shell: [
    "..kkkkkk..",
    ".kmlmmlmk.",
    "kmmlmmlmmk",
    "kmmlmmlmmk",
    "kmmlmmlmmk",
    ".kmlmmlmk.",
    "..kmllmk..",
    ".kkddddkk.",
    ".kddkkddk.",
  ],
  starfish: [
    ".....k.....",
    "....kmk....",
    "...kmmmk...",
    "kkkkmlmkkkk",
    "kmmmmmmmmmk",
    ".kmmmlmmmk.",
    "..kmmmmmk..",
    ".kmmmkmmmk.",
    ".kmmk.kmmk.",
    "kmmk...kmmk",
    "kkk.....kkk",
  ],

  /* ---------- jungle ---------- */
  gorilla: [
    "......kkkk......",
    ".....kbbbbk.....",
    "....kbbbbbbk....",
    "....kbkkkkbk....",
    "....kfwkkwfk....",
    "....kffffffk....",
    "....kfkffkfk....",
    "..kkkbfkkfbkkk..",
    ".kbbbbbffbbbbbk.",
    "kbbbbbffffbbbbbk",
    "kbbkbbffffbbkbbk",
    "kbbkbbbffbbbkbbk",
    "kbbkbbbbbbbbkbbk",
    "kffkbbbkkbbbkffk",
    ".kk.kbbk.kbbk.kk",
    "....kkkk.kkkk...",
  ],
  parrot: [
    "........kkkk....",
    "......kkrrrrkk..",
    ".....krrrrrwwkkk",
    ".....krrrrwewknk",
    ".....krrrrrwknnk",
    "....krrrrrrrknk.",
    "...krrrrrrrrk.k.",
    "..krryyyyrrrk...",
    "..kryyuuuyrrk...",
    ".kruuuuuuurk....",
    ".kuuuuuuurk.....",
    "kruuuuuuk.......",
    "krrruuk.........",
    "krrrk...........",
    "krrk............",
    "kk..............",
  ],
  monkey: [
    ".....kkkkkk.....",
    "....kbbbbbbk....",
    ".kk.kbbbbbbk.kk.",
    "ktbkbttbbttbkbtk",
    "ktbkttttttttkbtk",
    ".kkktkttttktkkk.",
    "...kttttttttk...",
    "...kttkkkkttk...",
    "....kkttttkk....",
    "...kbbbttbbbk...",
    "..kbbbttttbbbk..",
    ".kbkbbttttbbkbk.",
    ".kbkbbbttbbbkbkk",
    ".ktk.kbbbbk.ktkb",
    "..k..kbkkbk..kk.",
    ".....kk..kk.....",
  ],
  sloth: [
    "wwwkwwwwwwwwkwww",
    "dddkddddddddkddd",
    "...kg......gk...",
    "...kgk....kgk...",
    "...kgk....kgk...",
    "...kgkkkkkkgk...",
    "...kggffffggk...",
    "...kgmmffmmgk...",
    "...kgmkffkmgk...",
    "...kgmffffmgk...",
    "...kgffkkffgk...",
    "...kgfkffkfgk...",
    "..kgggffffgggk..",
    "..kggggggggggk..",
    "...kggggggggk...",
    "....kkkkkkkk....",
  ],
  log: [
    ".kkkkkkkkkk.",
    "kwwwwwwwkrrk",
    "kwddwwdwkrdk",
    "kwwwwwwwkrrk",
    "kwwwddwwkrrk",
    ".kkkkkkkkkk.",
  ],
  drum: [
    ".kkkkkkkk.",
    "kssssssssk",
    "kkkkkkkkkk",
    ".kooddook.",
    ".kodoodok.",
    "..kdoodk..",
    "..koddok..",
    "..kodook..",
    "..kkkkkk..",
  ],
  coconut: [
    "...kkkk...",
    ".kkcccckk.",
    ".kldcdcck.",
    "kllcccccck",
    "klccccdcck",
    "kcccccccck",
    "kcccccccdk",
    ".kccccddk.",
    ".kkcdddkk.",
    "...kkkk...",
  ],
  pod: [
    "...kk...",
    "..kggk..",
    ".kgldgk.",
    ".kglggk.",
    "kgggdggk",
    "kglgggdk",
    "kggdgggk",
    "kglggdgk",
    ".kgdggk.",
    ".kgggdk.",
    "..kggk..",
    "...kk...",
  ],
  fruit: [
    ".....kkk..",
    "....kkggk.",
    "..kkkmkk..",
    ".kmlmmmmk.",
    "kmllmmmmmk",
    "kmlmmmmmmk",
    "kmmmmmmmmk",
    "kmmmmmmmdk",
    ".kmmmmmdk.",
    ".kkddddkk.",
    "...kkkk...",
  ],
  flower: [
    "....kkk....",
    "...kmlmk...",
    ".kkkmmmkkk.",
    "kmmmkkkmmmk",
    "kmlkyyykmlk",
    "kmmkyyykmmk",
    "kmmmkkkmmmk",
    ".kkkmmmkkk.",
    "...kmmmk...",
    "....kkk....",
  ],

  /* ---------- space ---------- */
  rocket: [
    "..kkk...........",
    "..krrkkkkkkkk...",
    "fkkkwwwwwwwwwkk.",
    "ffkwwwwkbbkwwwrk",
    "yfkwwwwkbwbkwwrk",
    "ffkwwwwkbbkwwwrk",
    "fkkkwwwwwwwwwkk.",
    "..krrkkkkkkkk...",
    "..kkk...........",
  ],
  alien: [
    "..kgk......kgk..",
    "...k........k...",
    "....k......k....",
    "....kkkkkkkk....",
    "..kkggggggggkk..",
    ".kggggggggggggk.",
    "kgkkkggggggkkkgk",
    "kgkwkggggggkwkgk",
    "kgkkkggggggkkkgk",
    ".kggggggggggggk.",
    "..kgggkkkkgggk..",
    "...kggggggggk...",
    "....kkkkkkkk....",
    "...kgk.kk.kgk...",
    "..kgk......kgk..",
    "..kk........kk..",
  ],
  ufo: [
    "......kkkk......",
    ".....kbbwbk.....",
    "....kbbggbwk....",
    "....kbggggbk....",
    ".kkkkkkkkkkkkkk.",
    "kmmymmmymmmymmmk",
    ".kkkkkkkkkkkkkk.",
    "....kyk..kyk....",
  ],
  robot: [
    ".......rr.......",
    ".......kk.......",
    "...kkkkkkkkkk...",
    "...kmmmmmmmmk...",
    "...kmbbmmbbmk...",
    "...kmbwmmbwmk...",
    "...kmmmmmmmmk...",
    "...kmkmkmkmmk...",
    "...kkkkkkkkkk...",
    ".kk.kmmmmmmk.kk.",
    "kmmkkbbrybbkkmmk",
    "kmk.kbbbbbbk.kmk",
    "kk..kmmmmmmk..kk",
    "....kmk..kmk....",
    "...kkmk..kmkk...",
    "...kkkk..kkkk...",
  ],
  satellite: [
    ".....kk.....",
    "kkkk.kk.kkkk",
    "kbbkkmmkkbbk",
    "kbbkmmrmkbbk",
    "kbbkkmmkkbbk",
    "kkkk.kk.kkkk",
  ],
  laser: [
    "....kkkk",
    "...kyyok",
    "..kyyok.",
    ".kyyok..",
    "kyyyykkk",
    "kkkyyyyk",
    "..kyyok.",
    ".kyyok..",
    "kyyok...",
    "kkk.....",
  ],
  sparkle: [
    "....k....",
    "...kbk...",
    "...kwk...",
    "kkkbwbkkk",
    "kbwwwwwbk",
    "kkkbwbkkk",
    "...kwk...",
    "...kbk...",
    "....k....",
  ],
  planet: [
    "....kkkk....",
    "..kkmlmmkk..",
    ".kmllmmmmmk.",
    ".kmlmmmmmmk.",
    "rrrrrrrrrrrr",
    ".kmmmmmmmdk.",
    "..kkmmmdkk..",
    "....kkkk....",
  ],
  comet: [
    "..........kk",
    "........kktk",
    "......kkttk.",
    "..kkkkkttk..",
    ".kmlmmktk...",
    "kmllmmmkk...",
    "kmlmmmmmk...",
    "kmmmmmmdk...",
    ".kmmmmdk....",
    "..kkkkk.....",
  ],

  /* ---------- city ---------- */
  worker: [
    ".....kkkkkk.....",
    "....khhhhhhk....",
    "...khhhhhhhhk...",
    "..kkkkkkkkkkkk..",
    "....kssssssk....",
    "....kskssksk....",
    "....kssssssk....",
    "....ksskkssk....",
    ".....kkkkkk.....",
    "...koyoooooyok..",
    "..ksoyoooooyosk.",
    "..ksoyyyyyyyosk.",
    "..kk.kbbbbbk.kk.",
    ".....kbbkbbk....",
    ".....kbbkbbk....",
    "....kkkk.kkkk...",
  ],
  runner: [
    "......kkkk......",
    ".....khhhhk.....",
    ".....khhssk.....",
    ".....khsksk.....",
    ".....kssssk.....",
    "......kkkk......",
    "....kppppppk....",
    "..kspppppppsk...",
    ".ks.kppppk.ks...",
    ".....kbbbbk.....",
    "....kbbkkbbk....",
    "...kssk..kssk...",
    "..kssk....kssk..",
    ".kssk......ksk..",
    "krrk.......krrk.",
    "kkk........kkk..",
  ],
  cyclist: [
    ".........kkk....",
    "........kuuuk...",
    "........kssk....",
    "........kskk....",
    ".......kgggk....",
    "......kggggk.kk.",
    "......kggggggk..",
    ".......kbbk..k..",
    ".kkkk.kbbk.kkkk.",
    "k....kkkbkk....k",
    "k.kk.k.kk.k.kk.k",
    "k.kk.kkk..k.kk.k",
    "k....k....k....k",
    ".kkkk......kkkk.",
  ],
  skater: [ // skateboarder: cap, arms out for balance, board with wheels
    ".......kkkk.....",
    "......kccccck...",
    "......kcccckkk..",
    "......ksksk.....",
    "......kssssk....",
    ".......kkkk.....",
    "kssskttttttkssk.",
    "....kttttttk....",
    ".....kbbbbk.....",
    ".....kbbkbbk....",
    "....kbbk.kbbk...",
    "....kbk...kbk...",
    "k..kwwk...kwwk.k",
    ".kddddddddddddk.",
    "...kyk....kyk...",
  ],
  anvil: [
    "kkkkkkkkkkk.",
    "kllllllllmk.",
    ".kkmmmmmmmk.",
    "...kmmmmk...",
    "...kmmdmk...",
    "..kmmmmddk..",
    ".kkkkkkkkkk.",
  ],
  barrel: [
    ".kkkkkkkk.",
    "kllluuuuuk",
    "kkkkkkkkkk",
    "kluuuuuudk",
    "kluuuuuudk",
    "kddddddddk",
    "kluuuuuudk",
    "kluuuuuudk",
    "kddddddddk",
    "kluuuuuudk",
    ".kkkkkkkk.",
  ],
  lid: [
    ".....kk.....",
    "....kddk....",
    "..kkkkkkkk..",
    ".kllllmmmmk.",
    "kmmmmmmmmmdk",
    ".kkkkkkkkkk.",
  ],
  hydrant: [
    "...kkkk...",
    "..krrrrk..",
    ".kkkkkkkk.",
    "..krlrrk..",
    "kkkrlrrkkk",
    "krkrlrrkrk",
    "kkkrlrrkkk",
    "..krlrrk..",
    "..krlrdk..",
    ".kkkkkkkk.",
    ".kddddddk.",
    ".kkkkkkkk.",
  ],
  sign: [
    "..kkkk..",
    ".kwwwwk.",
    "kwmmmmwk",
    "kwmlmmwk",
    "kwmmmmwk",
    ".kwwwwk.",
    "..kkkk..",
    "...kpk..",
    "...kpk..",
    "...kpk..",
    "..kkkkk.",
  ],
  cone: [ // traffic cone with a reflective band
    "....kk....",
    "...kmlk...",
    "...kmmk...",
    "..kwwwwk..",
    "..kmlmmk..",
    ".kmlmmmmk.",
    ".kwwwwwwk.",
    "kmlmmmmmmk",
    "kkkkkkkkkk",
    "kddddddddk",
    "kkkkkkkkkk",
  ],
  boombox: [
    "...kkkkkk...",
    "..k......k..",
    "kkkkkkkkkkkk",
    "kmmmmmmmmmmk",
    "kmkkkmmkkkmk",
    "kmkdkmmkdkmk",
    "kmkkkmmkkkmk",
    "kmmmmmmmmmmk",
    "kkkkkkkkkkkk",
  ],

  /* ---------- UI icons (single colour "x") ---------- */
  play: ["x.......", "xxx.....", "xxxxx...", "xxxxxxx.", "xxxxxxx.", "xxxxx...", "xxx.....", "x......."],
  pause: ["xx..xx", "xx..xx", "xx..xx", "xx..xx", "xx..xx", "xx..xx", "xx..xx"],
  full: ["xxx...xxx", "x.......x", "x.......x", ".........", ".........", ".........", "x.......x", "x.......x", "xxx...xxx"],
  unfull: ["..x...x..", "..x...x..", "xxx...xxx", ".........", ".........", ".........", "xxx...xxx", "..x...x..", "..x...x.."],
  eraser: [".kkkkkkkk.", "kppppbbbbk", "kppppbbbbk", "kddddeeeek", ".kkkkkkkk."],
  trash: ["...kk...", "kkkkkkkk", "kllllllk", "kkkkkkkk", ".kmmmmk.", ".kmdmdk.", ".kmdmdk.", ".kmdmdk.", ".kmmmmk.", "..kkkk.."],
};

/* tempo icons: 1, 2 or 3 pixel chevrons */
const CHEV = ["x...", "xx..", ".xx.", "..xx", ".xx.", "xx..", "x..."];
G.speed1 = CHEV;
G.speed2 = CHEV.map((r) => r + "." + r);
G.speed3 = CHEV.map((r) => r + "." + r + "." + r);
/* major / minor: happy and sad faces */
G.happy = ["..xxxxx..", ".x.....x.", "x..x.x..x", "x.......x", "x.x...x.x", "x..xxx..x", ".x.....x.", "..xxxxx.."];
G.sad   = ["..xxxxx..", ".x.....x.", "x..x.x..x", "x.......x", "x..xxx..x", "x.x...x.x", ".x.....x.", "..xxxxx.."];
G.meh   = ["..xxxxx..", ".x.....x.", "x..x.x..x", "x.......x", "x.......x", "x..xxxx.x", ".x.....x.", "..xxxxx.."];
G.peak  = ["...x.....", "..xxx..x.", ".xxxxxxxx", "xxxxxxxxx"];
G.spark = ["....x....", "....x....", "...xxx...", ".xxxxxxx.", "...xxx...", "....x....", "....x...."];
G.moon  = ["..xxxx...", ".xxx.....", "xxx......", "xxx......", "xxx......", "xxx......", ".xxx.....", "..xxxx..."];

/* ======================= palettes ======================= */
const P = {
  /* reef: muted, cool, sea-glass */
  crab: { r: "#d9735f", l: "#eda894", w: "#f4efe6" },
  puffer: { y: "#e8c46a", d: "#b8924a", w: "#f4efe6", o: "#d9805a" },
  fish: { o: "#e0803f", w: "#f4efe6", a: "#9a4f22" },
  turtle: { g: "#6fae84", G: "#3f7660", s: "#b5d6a0", e: "#0d2a3a" },
  /* jungle: saturated and warm */
  gorilla: { b: "#3d3550", f: "#a08aa6", w: "#ffffff" },
  parrot: { r: "#ff2a3d", w: "#ffffff", e: "#1d2b10", n: "#2b2b38", y: "#ffd000", u: "#1e90ff" },
  monkey: { b: "#b5651d", t: "#ffcf96" },
  sloth: { g: "#a58a63", f: "#f6e3bb", m: "#4d3a28", w: "#9c6b3a", d: "#6b4423" },
  /* space: neon on near-black */
  rocket: { r: "#ff2e88", w: "#e8ecff", b: "#29d9ff", f: "#ffb300", y: "#fff05a" },
  alien: { g: "#5dff6e", w: "#ffffff" },
  ufo: { b: "#7fe9ff", w: "#ffffff", g: "#5dff6e", m: "#9aa0c8", y: "#fff05a" },
  robot: { m: "#a9b0d6", b: "#29d9ff", w: "#ffffff", r: "#ff2e88", y: "#fff05a" },
  /* city: dusky, slightly greyed */
  worker: { h: "#f2c230", s: "#e3b48f", o: "#f07f2a", y: "#fff1a0", b: "#3d5aa8" },
  runner: { h: "#3a2a26", s: "#e3b48f", p: "#e0587a", b: "#3f4055", r: "#d94a4a" },
  cyclist: { u: "#3a8fd6", s: "#e3b48f", g: "#4fae6a", b: "#3f4055" },
  skater: { c: "#d94a4a", s: "#c98f62", t: "#3fb0a8", b: "#3d5aa8", w: "#efe8e6", d: "#a77be6", y: "#f2d64a" },
};

/* ======================= characters ======================= */
const CHAR_GRID = {
  crab: "crab", puffer: "puffer", fish: "fish", turtle: "turtle",
  gorilla: "gorilla", parrot: "parrot", monkey: "monkey", sloth: "sloth",
  rocket: "rocket", alien: "alien", ufo: "ufo", robot: "robot",
  worker: "worker", runner: "runner", cyclist: "cyclist", skater: "skater",
};
export const CharSprite = ({ id }) => <Sprite grid={G[CHAR_GRID[id]]} pal={P[id]} canvas={16} />;

/* world buttons use one character from each world */
export const WORLD_ICON = { aqua: "fish", jungle: "parrot", space: "alien", city: "worker" };

/* ======================= objects (same names as before) ======================= */
export const Rock = () => <Sprite grid={G.rock} pal={{ r: "#7d8a8f", d: "#56636a", l: "#a9b5b8" }} />;
export const Coral = () => <Sprite grid={G.coral} pal={{ c: "#d98a7a" }} />;
export const Bubble = () => <Sprite grid={G.bubble} pal={{ k: "#2c5f78", b: "#b6dbe6", w: "#f4fbfd", d: "#86b6c6" }} />;
export const Urchin = () => <Sprite grid={G.urchin} pal={{ k: "#2e3552", p: "#6a7398", l: "#98a2c4", d: "#4c5578" }} />;
export const Shell = ({ color }) => <Sprite grid={G.shell} pal={tones(color)} />;
export const Starfish = ({ color }) => <Sprite grid={G.starfish} pal={tones(color)} />;

export const Log = () => <Sprite grid={G.log} pal={{ w: "#b8692a", d: "#7a4216", r: "#f2c27a" }} />;
export const Drum = () => <Sprite grid={G.drum} pal={{ s: "#fff0cc", o: "#ee6a1f", d: "#a8400e" }} />;
export const Coconut = () => <Sprite grid={G.coconut} pal={{ c: "#7a4f2a", d: "#4a2e15", l: "#a87a4f" }} />;
export const SeedPod = () => <Sprite grid={G.pod} pal={{ g: "#b8e03a", d: "#6f9a14", l: "#e8ff8a" }} />;
export const Fruit = ({ color }) => <Sprite grid={G.fruit} pal={{ ...tones(color), g: "#5fbf3a" }} />;
export const Flower = ({ color }) => <Sprite grid={G.flower} pal={{ ...tones(color), y: "#ffe14d" }} />;

export const Asteroid = () => <Sprite grid={G.rock} pal={{ r: "#8a8fb8", d: "#585d86", l: "#c2c6ec" }} />;
export const Satellite = () => <Sprite grid={G.satellite} pal={{ b: "#29d9ff", m: "#c9cdea", r: "#ff2e88" }} />;
export const Laser = () => <Sprite grid={G.laser} pal={{ y: "#fff05a", o: "#ff9a1f", k: "#a34a00" }} />;
export const Sparkle = () => <Sprite grid={G.sparkle} pal={{ k: "#3a3a8a", b: "#7fe9ff", w: "#ffffff" }} />;
export const Planet = ({ color }) => <Sprite grid={G.planet} pal={{ ...tones(color), r: "#f2f5fa" }} />;
export const StarIcon = ({ color }) => <Sprite grid={G.starfish} pal={tones(color)} />;
export const Comet = ({ color }) => <Sprite grid={G.comet} pal={{ ...tones(color), t: "#e8f4ff" }} />;

export const Anvil = () => <Sprite grid={G.anvil} pal={{ m: "#77737f", l: "#aca8b4", d: "#4c4954" }} />;
export const Barrel = () => <Sprite grid={G.barrel} pal={{ u: "#4a6fa8", d: "#2f4774", l: "#86a3cf" }} />;
export const Lid = () => <Sprite grid={G.lid} pal={{ m: "#94929c", l: "#cfccd6", d: "#5d5a66" }} />;
export const Hydrant = () => <Sprite grid={G.hydrant} pal={{ r: "#d9483f", l: "#f08a80", d: "#8a2a24" }} />;
export const Sign = ({ color }) => <Sprite grid={G.sign} pal={{ ...tones(color), w: "#efe8e6", p: "#8a8690" }} />;
export const Cone = ({ color }) => <Sprite grid={G.cone} pal={{ ...tones(color), w: "#f4f1ea", d: "#3f4055" }} />;
export const Boombox = ({ color }) => <Sprite grid={G.boombox} pal={{ ...tones(color), d: "#8d949f" }} />;

/* ======================= UI icons ======================= */
export const Icon = ({ name, color = "currentColor" }) => (
  <Sprite grid={G[name]} pal={{ x: color }} canvas={9} />
);
export const EraserIcon = () => <Sprite grid={G.eraser} pal={{ p: "#ff8fb0", b: "#5bb8ff", d: "#c45a7a", e: "#2f7fc4" }} canvas={10} />;
export const TrashIcon = () => <Sprite grid={G.trash} pal={{ l: "#d4d9e2", m: "#9aa3b2", d: "#5f6878" }} canvas={10} />;
